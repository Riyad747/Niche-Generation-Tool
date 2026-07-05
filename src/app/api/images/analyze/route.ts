import { z } from 'zod';
import { requireUser } from '@/lib/auth/require-user';
import { prisma } from '@/lib/db/client';
import { getUserAiClient } from '@/lib/ai';
import { ImageAnalysisService } from '@/lib/services/image-analysis.service';
import { parseImageDataUrl, base64Bytes } from '@/lib/utils/data-url';
import { handle, ok, fail, enforceRate } from '@/lib/api/respond';
import { QuotaService } from '@/lib/services/quota.service';
import { PLAN_LIMITS } from '@/config/plans';

export const maxDuration = 60; // vision analysis can take a while

const schema = z.object({
  dataUrl: z.string().startsWith('data:image/'),
  fileName: z.string().max(200).optional(),
});

const MAX_BYTES = 8 * 1024 * 1024; // 8MB

/** POST /api/images/analyze — analyze an uploaded image into an opportunity map. */
export async function POST(req: Request) {
  return handle(async () => {
    const user = await requireUser();
    const limited = await enforceRate(user.id, 'image', PLAN_LIMITS[user.plan].aiRatePerMin);
    if (limited) return limited;

    const { dataUrl, fileName } = schema.parse(await req.json());

    const image = parseImageDataUrl(dataUrl);
    if (base64Bytes(image.base64) > MAX_BYTES) {
      return fail('TOO_LARGE', 'Image exceeds 8MB', 413);
    }

    await new QuotaService().consume(user.id, user.plan, 'imageAnalyses');

    const record = await prisma.imageAnalysis.create({
      data: {
        userId: user.id,
        blobUrl: 'inline', // swap for a Vercel Blob URL when storage is wired
        fileName,
        mimeType: image.mediaType,
        status: 'RUNNING',
      },
    });

    const ai = await getUserAiClient(user.id);
    const result = await new ImageAnalysisService(ai).analyze(record.id, image);

    return ok({ id: record.id, ...result }, 201);
  });
}
