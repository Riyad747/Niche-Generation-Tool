export const PLATFORMS = [
  'ADOBE_STOCK',
  'SHUTTERSTOCK',
  'FREEPIK',
  'CREATIVE_MARKET',
  'ENVATO',
] as const;
export type PlatformKey = (typeof PLATFORMS)[number];

export const AI_TOOLS = ['MIDJOURNEY', 'FLUX', 'CHATGPT_IMAGE', 'STABLE_DIFFUSION'] as const;
export type AiToolKey = (typeof AI_TOOLS)[number];

export const ASSET_TYPES = ['PNG', 'VECTOR', 'ILLUSTRATION'] as const;

/** Mode 1 expansion guardrails — bound recursion so a run can't explode. */
export const EXPANSION = {
  DEFAULT_DEPTH: 3,
  MAX_DEPTH: 5,
  DEFAULT_BREADTH: 8, // children per node
  MAX_BREADTH: 12,
  MAX_NICHES_PER_SESSION: 400,
  CONCURRENCY: 6, // parallel scoring calls
};

export const IDEA_COUNTS = { png: 50, vector: 50, illustration: 50 } as const;

export const CACHE_TTL = {
  trend: 60 * 60 * 12, // 12h
  saturation: 60 * 60 * 6, // 6h
  aiMemo: 60 * 60 * 24 * 7, // 7d
} as const;
