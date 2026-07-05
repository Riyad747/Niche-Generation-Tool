import type { ModelId } from './client';

/**
 * Per-engine model routing. Heavy reasoning → Claude; bulk/cheap → OpenAI.
 * Change routing here without touching engine code.
 */
export type EngineName =
  | 'niche-expansion'
  | 'scoring'
  | 'compliance'
  | 'approval-predictor'
  | 'prompt-generator'
  | 'prompt-validator'
  | 'keyword'
  | 'title'
  | 'image-analysis'
  | 'copilot'
  | 'classify';

const POLICY: Record<EngineName, ModelId> = {
  // hardest synthesis → Opus
  'niche-expansion': 'claude-opus-4-8',
  'image-analysis': 'claude-opus-4-8',
  copilot: 'claude-opus-4-8',
  // reasoning-heavy but routine → Sonnet
  scoring: 'claude-sonnet-5',
  compliance: 'claude-sonnet-5',
  'approval-predictor': 'claude-sonnet-5',
  'prompt-generator': 'claude-sonnet-5',
  'prompt-validator': 'claude-sonnet-5',
  title: 'claude-sonnet-5',
  // high-volume / cheap
  keyword: 'claude-haiku-4-5-20251001',
  classify: 'gpt-cheap',
};

export function modelFor(engine: EngineName): ModelId {
  return POLICY[engine];
}
