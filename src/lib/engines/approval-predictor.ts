import { toScore } from '@/lib/utils/score-math';

/**
 * Adobe Stock Approval Predictor — probability (0..100) that quality assets in a
 * niche get approved. Combines expected quality, market competition, compliance
 * safety, technical risk, and similarity/over-saturation risk.
 */
export interface ApprovalFactors {
  quality: number; // 0..100 expected craft/quality achievable
  competitionScore: number; // 0..100 higher = more saturated
  commercialSafety: number; // 0..100 higher = safer (from Compliance)
  technicalRisk: number; // 0..100 higher = more technical-reject risk
  similarityRisk: number; // 0..100 higher = "too similar to existing" reject risk
}

export interface ApprovalResult {
  probability: number;
  qualityScore: number;
  competitionScore: number;
  complianceScore: number;
  technicalScore: number;
  similarityScore: number;
}

export function predictApproval(f: ApprovalFactors): ApprovalResult {
  const qualityScore = f.quality;
  const complianceScore = f.commercialSafety;
  const technicalScore = 100 - f.technicalRisk;
  const similarityScore = 100 - f.similarityRisk;
  // Over-saturation raises the bar for approval (reviewers reject near-duplicates).
  const competitionPenalty = f.competitionScore * 0.25;

  const probability = toScore(
    0.3 * qualityScore +
      0.25 * complianceScore +
      0.2 * technicalScore +
      0.25 * similarityScore -
      competitionPenalty,
  );

  return {
    probability,
    qualityScore,
    competitionScore: f.competitionScore,
    complianceScore,
    technicalScore,
    similarityScore,
  };
}
