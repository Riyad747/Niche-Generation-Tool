import type { AiClient } from '@/lib/ai/client';
import { modelFor } from '@/lib/ai/model-policy';
import { NicheAssessmentSchema, type NicheAssessment } from '@/lib/ai/schemas';
import { assessmentPrompt } from '@/lib/ai/prompts/niche';
import { computeAiCompatScore } from '@/lib/engines/ai-compat';
import { computeVectorScore } from '@/lib/engines/vectorization';
import { levelFromIndex, type SaturationLevel } from '@/lib/engines/saturation';
import { predictApproval } from '@/lib/engines/approval-predictor';
import { computeOpportunityScore, type SubScores } from '@/lib/engines/opportunity-score';
import { blend } from '@/lib/utils/score-math';
import { SCORE_VERSION } from '@/config/weights';
import type { NicheSignals } from './signals.service';
import type { GrowthState } from '@prisma/client';

export interface ScoredNiche {
  scores: SubScores;
  opportunityScore: number;
  growthState: GrowthState;
  saturation: SaturationLevel;
  breakdown: Record<string, unknown>;
}

/**
 * ScoringService — turns a niche into the eight sub-scores + unified opportunity
 * score. The AI estimates raw factor inputs; deterministic engines compute every
 * final score. When real `signals` are supplied (Phase 2), measured trend and
 * saturation are blended with the AI estimates and marked in the breakdown.
 */
export class ScoringService {
  constructor(private ai: AiClient) {}

  async scoreNiche(
    name: string,
    description?: string,
    opts?: { signals?: NicheSignals },
  ): Promise<ScoredNiche> {
    const { system, user } = assessmentPrompt(name, description);
    const a = await this.ai.json<NicheAssessment>({
      system,
      user,
      schema: NicheAssessmentSchema,
      model: modelFor('scoring'),
      engine: 'scoring',
    });
    return this.fromAssessment(a, opts?.signals);
  }

  /** Pure: assessment (+ optional measured signals) → scores. */
  fromAssessment(a: NicheAssessment, signals?: NicheSignals): ScoredNiche {
    const aiCompatScore = computeAiCompatScore(a.aiCompat);
    const vectorCompatScore = computeVectorScore(a.vector);

    // Blend measured signals with AI estimates where available.
    const competitionScore = signals
      ? blend(signals.competitionScore, a.competition)
      : Math.round(a.competition);
    const trendScore = signals ? blend(signals.trendScore, a.trend) : Math.round(a.trend);
    const growthState = signals?.growthState ?? a.growthState;
    const saturation = signals?.saturationLevel ?? levelFromIndex(competitionScore);

    // Approval probability via the dedicated engine (more principled than a raw
    // AI number): technical risk falls out of AI-compat, similarity risk of
    // saturation.
    const approval = predictApproval({
      quality: a.approvalProbability,
      competitionScore,
      commercialSafety: a.commercialSafety,
      technicalRisk: 100 - aiCompatScore,
      similarityRisk: competitionScore,
    });

    const scores: SubScores = {
      demandScore: Math.round(a.demand),
      competitionScore,
      trendScore,
      seasonalityScore: Math.round(a.seasonality),
      aiCompatScore,
      vectorCompatScore,
      commercialSafetyScore: Math.round(a.commercialSafety),
      approvalProbabilityScore: approval.probability,
    };

    return {
      scores,
      opportunityScore: computeOpportunityScore(scores),
      growthState,
      saturation,
      breakdown: {
        version: SCORE_VERSION,
        estimated: {
          demand: true,
          trend: signals ? signals.trendEstimated : true,
          competition: signals ? signals.saturationEstimated : true,
          approval: true,
        },
        aiCompatFactors: a.aiCompat,
        vectorFactors: a.vector,
        approval,
        signals: signals ?? null,
        model: modelFor('scoring'),
      },
    };
  }
}
