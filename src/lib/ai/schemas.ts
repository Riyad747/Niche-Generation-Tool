import { z } from 'zod';

/**
 * Zod schemas for structured AI output. The AI's job is to *estimate raw factor
 * inputs* for a niche; our deterministic engines turn those into final 0..100
 * scores. This keeps scoring explainable, cheap to re-run, and testable —
 * the model never emits the final score directly.
 */

const score100 = z.number().min(0).max(100);

/** One expanded child niche. */
export const ExpandedNicheSchema = z.object({
  name: z.string().min(1).max(80),
  description: z.string().max(400),
  kind: z.enum(['sub', 'related', 'adjacent', 'emerging', 'future']),
});
export type ExpandedNiche = z.infer<typeof ExpandedNicheSchema>;

export const ExpansionSchema = z.object({
  children: z.array(ExpandedNicheSchema).max(12),
});
export type Expansion = z.infer<typeof ExpansionSchema>;

/** Raw factor inputs the AI estimates for a single niche. */
export const NicheAssessmentSchema = z.object({
  demand: score100,
  competition: score100,
  trend: score100,
  seasonality: score100,
  commercialSafety: score100,
  approvalProbability: score100,
  growthState: z.enum(['EMERGING', 'RISING', 'EXPLOSIVE', 'STABLE', 'DECLINING']),
  aiCompat: z.object({
    complexity: score100,
    textRequirements: score100,
    diagramRequirements: score100,
    consistencyRequirements: score100,
    objectCount: score100,
    detailDensity: score100,
  }),
  vector: z.object({
    edgeSimplicity: score100,
    shapeSeparation: score100,
    colorSimplicity: score100,
    noiseRisk: score100,
    detailDensity: score100,
  }),
  /** which factors are AI-estimated vs measured — surfaced as a confidence hint */
  estimated: z.boolean(),
});
export type NicheAssessment = z.infer<typeof NicheAssessmentSchema>;

/** Content generation for a niche: keywords, titles, asset ideas. */
export const KeywordItemSchema = z.object({
  term: z.string().min(1),
  kind: z.enum([
    'PRIMARY',
    'SECONDARY',
    'LONG_TAIL',
    'SEMANTIC',
    'COMMERCIAL',
    'INTENT',
    'ADOBE',
    'SHUTTERSTOCK',
  ]),
  score: score100,
});

export const TitleItemSchema = z.object({
  text: z.string().min(1).max(200),
  kind: z.enum(['SEO', 'ADOBE_STOCK', 'SHUTTERSTOCK', 'FREEPIK', 'COMMERCIAL']),
});

export const AssetIdeaSchema = z.object({
  title: z.string().min(1).max(160),
  assetType: z.enum(['PNG', 'VECTOR', 'ILLUSTRATION']),
  prompt: z.string().min(1),
});

export const NicheContentSchema = z.object({
  keywords: z.array(KeywordItemSchema).max(60),
  titles: z.array(TitleItemSchema).max(30),
  ideas: z.array(AssetIdeaSchema).max(60),
});
export type NicheContent = z.infer<typeof NicheContentSchema>;

/** Prompt Generator — prompt packs across tools/styles. */
export const PromptPackSchema = z.object({
  prompts: z
    .array(
      z.object({
        kind: z.enum(['MIDJOURNEY', 'FLUX', 'VECTOR', 'ILLUSTRATION']),
        body: z.string().min(1),
        variations: z.array(z.string()).max(4),
      }),
    )
    .max(16),
});
export type PromptPack = z.infer<typeof PromptPackSchema>;

/** Mode 3 — Image → Opportunity analysis output. */
export const ImageAnalysisSchema = z.object({
  visualStyle: z.string().max(200),
  composition: z.string().max(300),
  colorPalette: z.array(z.string()).max(8), // hex or names
  commercialIntent: score100,
  categoryFit: z.string().max(120),
  aiReproducibility: score100,
  vectorSuitability: score100,
  approvalProbability: score100,
  relatedNiches: z.array(z.string()).max(50),
  keywords: z.array(z.string()).max(100),
  titles: z.array(z.string()).max(50),
  promptVariations: z.array(z.string()).max(100),
});
export type ImageAnalysisResult = z.infer<typeof ImageAnalysisSchema>;
