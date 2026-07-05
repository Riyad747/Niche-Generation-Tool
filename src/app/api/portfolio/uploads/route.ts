import { z } from 'zod';
import { requireUser } from '@/lib/auth/require-user';
import { portfolioRepo } from '@/lib/db/repositories/portfolio-repo';
import { PortfolioService } from '@/lib/services/portfolio.service';
import { handle, ok } from '@/lib/api/respond';

const schema = z.object({
  csv: z.string().min(10),
  platform: z.enum(['ADOBE_STOCK', 'SHUTTERSTOCK', 'FREEPIK', 'CREATIVE_MARKET', 'ENVATO']),
  fileName: z.string().max(200).default('portfolio.csv'),
});

/** POST /api/portfolio/uploads — ingest a contributor CSV and compute gaps. */
export async function POST(req: Request) {
  return handle(async () => {
    const user = await requireUser();
    const { csv, platform, fileName } = schema.parse(await req.json());

    const upload = await portfolioRepo.createUpload({
      userId: user.id,
      platform,
      fileName,
      rowCount: 0,
    });

    // CSV parse + gap detection is fast and deterministic — run inline.
    await new PortfolioService().process(upload.id, csv);

    return ok({ id: upload.id }, 201);
  });
}

/** GET /api/portfolio/uploads — recent uploads. */
export async function GET() {
  return handle(async () => {
    const user = await requireUser();
    const data = await portfolioRepo.listUploads(user.id);
    return ok({ data });
  });
}
