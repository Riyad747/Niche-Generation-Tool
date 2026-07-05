import { describe, it, expect } from 'vitest';
import {
  computeOpportunityScore,
  isUnderserved,
  type SubScores,
} from '@/lib/engines/opportunity-score';

const base: SubScores = {
  demandScore: 80,
  competitionScore: 20,
  trendScore: 80,
  seasonalityScore: 50,
  aiCompatScore: 80,
  vectorCompatScore: 80,
  commercialSafetyScore: 90,
  approvalProbabilityScore: 80,
};

describe('computeOpportunityScore', () => {
  it('stays within 0..100', () => {
    const score = computeOpportunityScore(base);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('does not blow up as competition approaches zero (bounded, unlike spec formula)', () => {
    const zeroComp = computeOpportunityScore({ ...base, competitionScore: 0 });
    expect(zeroComp).toBeLessThanOrEqual(100);
  });

  it('rewards low competition over high competition', () => {
    const low = computeOpportunityScore({ ...base, competitionScore: 10 });
    const high = computeOpportunityScore({ ...base, competitionScore: 90 });
    expect(low).toBeGreaterThan(high);
  });

  it('rewards higher demand', () => {
    const weak = computeOpportunityScore({ ...base, demandScore: 20 });
    const strong = computeOpportunityScore({ ...base, demandScore: 95 });
    expect(strong).toBeGreaterThan(weak);
  });

  it('applies a mild seasonality boost', () => {
    const off = computeOpportunityScore({ ...base, seasonalityScore: 0 });
    const peak = computeOpportunityScore({ ...base, seasonalityScore: 100 });
    expect(peak).toBeGreaterThan(off);
  });
});

describe('isUnderserved', () => {
  it('flags high-score, low-saturation niches', () => {
    expect(isUnderserved(75, 30)).toBe(true);
  });
  it('rejects saturated niches', () => {
    expect(isUnderserved(75, 80)).toBe(false);
  });
  it('rejects low-opportunity niches', () => {
    expect(isUnderserved(40, 20)).toBe(false);
  });
});
