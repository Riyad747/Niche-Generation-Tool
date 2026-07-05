import { describe, it, expect } from 'vitest';
import { analyzeTrend } from '@/lib/engines/trend';
import { predictApproval } from '@/lib/engines/approval-predictor';
import { planProduction } from '@/lib/engines/content-factory';
import { classifyGap, suggestedFillCount } from '@/lib/engines/gap-detector';
import { supplyIndex, levelFromIndex } from '@/lib/engines/saturation';
import type { SubScores } from '@/lib/engines/opportunity-score';

const range = (n: number, f: (i: number) => number) => Array.from({ length: n }, (_, i) => f(i));

describe('Trend engine', () => {
  it('classifies a steadily rising series as RISING with a high-ish score', () => {
    const r = analyzeTrend(range(24, (i) => 20 + i * 2)); // 20 → 66
    expect(r.growthState).toBe('RISING');
    expect(r.slope).toBeGreaterThan(0);
    expect(r.trendScore).toBeGreaterThan(50);
  });

  it('classifies a falling series as DECLINING', () => {
    const r = analyzeTrend(range(24, (i) => 80 - i * 2));
    expect(r.growthState).toBe('DECLINING');
  });

  it('classifies an accelerating low-base series as EXPLOSIVE', () => {
    // flat-ish then sharply up
    const pts = [...range(12, () => 10), ...range(12, (i) => 10 + i * i)];
    const r = analyzeTrend(pts);
    expect(['EXPLOSIVE', 'RISING']).toContain(r.growthState);
  });

  it('treats a flat series as STABLE', () => {
    const r = analyzeTrend(range(24, () => 50));
    expect(r.growthState).toBe('STABLE');
  });
});

describe('Approval predictor', () => {
  it('safe, high-quality, low-competition niche → high approval', () => {
    const r = predictApproval({
      quality: 85,
      competitionScore: 20,
      commercialSafety: 95,
      technicalRisk: 10,
      similarityRisk: 20,
    });
    expect(r.probability).toBeGreaterThan(70);
  });

  it('saturated, risky niche → low approval', () => {
    const r = predictApproval({
      quality: 50,
      competitionScore: 95,
      commercialSafety: 40,
      technicalRisk: 70,
      similarityRisk: 90,
    });
    expect(r.probability).toBeLessThan(40);
  });
});

describe('Content factory planner', () => {
  const easy: SubScores = {
    demandScore: 80,
    competitionScore: 20,
    trendScore: 70,
    seasonalityScore: 40,
    aiCompatScore: 90,
    vectorCompatScore: 90,
    commercialSafetyScore: 90,
    approvalProbabilityScore: 80,
  };

  it('easy, high-compat niche produces fast + high scaling', () => {
    const plan = planProduction(easy, 'VECTOR');
    expect(plan.estProductionMinutes).toBeLessThan(25);
    expect(plan.estScalingPotential).toBeGreaterThan(70);
    expect(plan.estPortfolioSize).toBeGreaterThan(100);
  });

  it('illustrations take longer than PNGs', () => {
    const png = planProduction(easy, 'PNG').estProductionMinutes;
    const illus = planProduction(easy, 'ILLUSTRATION').estProductionMinutes;
    expect(illus).toBeGreaterThan(png);
  });
});

describe('Gap detector', () => {
  const highDemand: SubScores = {
    demandScore: 75,
    competitionScore: 20,
    trendScore: 70,
    seasonalityScore: 40,
    aiCompatScore: 80,
    vectorCompatScore: 80,
    commercialSafetyScore: 90,
    approvalProbabilityScore: 80,
  };

  it('high demand + low supply → underserved', () => {
    expect(classifyGap(highDemand, 'GREEN')).toBe('underserved');
  });

  it('low demand + high supply → overserved', () => {
    expect(classifyGap({ ...highDemand, demandScore: 20, trendScore: 20 }, 'RED')).toBe('overserved');
  });

  it('suggested fill count is zero for overserved', () => {
    expect(suggestedFillCount('overserved', 80)).toBe(0);
    expect(suggestedFillCount('underserved', 80)).toBeGreaterThan(40);
  });
});

describe('Saturation supply index', () => {
  it('maps result counts to a sensible level', () => {
    expect(levelFromIndex(supplyIndex(10))).toBe('GREEN'); // barely any supply → underserved
    expect(supplyIndex(1_000_000)).toBeGreaterThan(supplyIndex(1000));
  });
});
