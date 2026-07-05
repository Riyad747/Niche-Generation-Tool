import { AI_COMPAT } from '@/config/weights';
import { toScore } from '@/lib/utils/score-math';

/**
 * AI Compatibility Engine — predicts how well text-to-image models can render
 * a niche. Each factor is a 0..100 "difficulty" the AI estimates from the niche
 * description; higher difficulty subtracts from a perfect 100.
 *
 * Text/diagram/consistency carry the biggest weights because current models
 * struggle most with in-image text, technical diagrams, and character
 * consistency across a series.
 */
export interface AiCompatFactors {
  complexity: number;
  textRequirements: number;
  diagramRequirements: number;
  consistencyRequirements: number;
  objectCount: number;
  detailDensity: number;
}

export function computeAiCompatScore(f: AiCompatFactors): number {
  const penalty =
    f.complexity * AI_COMPAT.complexity +
    f.textRequirements * AI_COMPAT.textRequirements +
    f.diagramRequirements * AI_COMPAT.diagramRequirements +
    f.consistencyRequirements * AI_COMPAT.consistencyRequirements +
    f.objectCount * AI_COMPAT.objectCount +
    f.detailDensity * AI_COMPAT.detailDensity;

  return toScore(100 - penalty);
}
