import type { AiClient, ImageInput } from '@/lib/ai/client';
import { modelFor } from '@/lib/ai/model-policy';
import { ImageAnalysisSchema, type ImageAnalysisResult } from '@/lib/ai/schemas';
import { prisma } from '@/lib/db/client';
import type { Prisma } from '@prisma/client';

const VISION_SYSTEM =
  'You are a microstock market analyst. Given an image a creator made (e.g. with MidJourney or ' +
  'Flux), analyze its commercial potential and turn it into a portfolio-expansion opportunity map.';

const VISION_USER = `Analyze this image for microstock. Return JSON:
{
  "visualStyle": "...", "composition": "...", "colorPalette": ["#hex", ...],
  "commercialIntent": 0-100, "categoryFit": "...",
  "aiReproducibility": 0-100,   // how easily AI can reproduce this style at scale
  "vectorSuitability": 0-100,   // how well it would vectorize
  "approvalProbability": 0-100, // likely Adobe Stock approval for this style
  "relatedNiches": [ up to 50 concrete, sellable niches this image could expand into ],
  "keywords": [ up to 100 microstock keywords ],
  "titles": [ up to 50 commercial titles ],
  "promptVariations": [ up to 100 MidJourney/Flux prompt variations to build a series ]
}
Keep everything commercially safe (no brands, logos, celebrities, trademarked characters).`;

/**
 * ImageAnalysisService (Mode 3) — Claude vision turns an uploaded image into a
 * full opportunity map: style/composition/palette, commercial scores, and
 * related niches + prompts + keywords + titles for portfolio expansion.
 */
export class ImageAnalysisService {
  constructor(private ai: AiClient) {}

  async analyze(imageId: string, image: ImageInput): Promise<ImageAnalysisResult> {
    const result = await this.ai.vision<ImageAnalysisResult>({
      system: VISION_SYSTEM,
      user: VISION_USER,
      image,
      schema: ImageAnalysisSchema,
      model: modelFor('image-analysis'),
      engine: 'image-analysis',
    });

    await prisma.imageAnalysis.update({
      where: { id: imageId },
      data: {
        status: 'COMPLETE',
        visualStyle: result.visualStyle,
        composition: result.composition,
        colorPalette: result.colorPalette as Prisma.InputJsonValue,
        commercialIntent: result.commercialIntent,
        categoryFit: result.categoryFit,
        aiReproducibility: result.aiReproducibility,
        vectorSuitability: result.vectorSuitability,
        approvalProbability: result.approvalProbability,
        raw: result as unknown as Prisma.InputJsonValue,
      },
    });

    return result;
  }
}
