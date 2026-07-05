import type { Plan } from '@prisma/client';

/**
 * Plan limits (per 30-day period). Enforced by QuotaService; surfaced in the UI.
 * `null` means unlimited. Keep this the single source of truth for gating.
 */
export interface PlanLimits {
  researchSessions: number | null;
  imageAnalyses: number | null;
  aiTokens: number | null;
  /** per-minute rate limit for AI-heavy routes */
  aiRatePerMin: number;
}

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  FREE: { researchSessions: 3, imageAnalyses: 5, aiTokens: 200_000, aiRatePerMin: 5 },
  PRO: { researchSessions: 50, imageAnalyses: 200, aiTokens: 5_000_000, aiRatePerMin: 20 },
  STUDIO: { researchSessions: 300, imageAnalyses: 1500, aiTokens: 30_000_000, aiRatePerMin: 60 },
  ENTERPRISE: { researchSessions: null, imageAnalyses: null, aiTokens: null, aiRatePerMin: 200 },
};

export type QuotaKind = 'researchSessions' | 'imageAnalyses' | 'aiTokens';

export const PERIOD_MS = 30 * 24 * 60 * 60 * 1000;
