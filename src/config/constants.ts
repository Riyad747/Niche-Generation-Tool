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

/**
 * Mode 1 expansion guardrails — bound recursion so a run can't explode.
 * Defaults are tuned for AI free tiers (e.g. Gemini ~15 req/min) AND the
 * serverless execution window (research runs inline for ≤300s without QStash):
 * a default run is ~21 niches (~26 AI calls ≈ 2 min on one free key).
 * Bump DEFAULT_DEPTH/BREADTH on a paid key or with QStash configured.
 */
export const EXPANSION = {
  DEFAULT_DEPTH: 2,
  MAX_DEPTH: 4,
  DEFAULT_BREADTH: 4, // children per node
  MAX_BREADTH: 10,
  MAX_NICHES_PER_SESSION: 120,
  CONCURRENCY: 2, // parallel scoring calls — modest so a single free key isn't rate-limited
};

export const IDEA_COUNTS = { png: 50, vector: 50, illustration: 50 } as const;

export const CACHE_TTL = {
  trend: 60 * 60 * 12, // 12h
  saturation: 60 * 60 * 6, // 6h
  aiMemo: 60 * 60 * 24 * 7, // 7d
} as const;
