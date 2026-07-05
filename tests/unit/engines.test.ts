import { describe, it, expect } from 'vitest';
import { computeAiCompatScore } from '@/lib/engines/ai-compat';
import { computeVectorScore } from '@/lib/engines/vectorization';
import {
  computeSaturationIndex,
  levelFromIndex,
} from '@/lib/engines/saturation';

describe('AI Compatibility', () => {
  it('a simple flat icon scores near-perfect', () => {
    const score = computeAiCompatScore({
      complexity: 5,
      textRequirements: 0,
      diagramRequirements: 0,
      consistencyRequirements: 0,
      objectCount: 5,
      detailDensity: 5,
    });
    expect(score).toBeGreaterThan(90);
  });

  it('heavy in-image text tanks the score', () => {
    const score = computeAiCompatScore({
      complexity: 60,
      textRequirements: 100,
      diagramRequirements: 80,
      consistencyRequirements: 70,
      objectCount: 60,
      detailDensity: 70,
    });
    expect(score).toBeLessThan(40);
  });
});

describe('Vectorization', () => {
  it('clean flat art scores high', () => {
    const score = computeVectorScore({
      edgeSimplicity: 90,
      shapeSeparation: 90,
      colorSimplicity: 90,
      noiseRisk: 5,
      detailDensity: 10,
    });
    expect(score).toBeGreaterThan(70);
  });

  it('noisy photographic subject scores low', () => {
    const score = computeVectorScore({
      edgeSimplicity: 20,
      shapeSeparation: 20,
      colorSimplicity: 15,
      noiseRisk: 90,
      detailDensity: 90,
    });
    expect(score).toBeLessThan(30);
  });
});

describe('Saturation', () => {
  it('few results + low similarity → GREEN (underserved)', () => {
    const idx = computeSaturationIndex({
      resultCount: 200,
      similarityDensity: 15,
      assetRepetition: 10,
      styleRepetition: 10,
    });
    expect(levelFromIndex(idx)).toBe('GREEN');
  });

  it('millions of near-identical results → RED (overserved)', () => {
    const idx = computeSaturationIndex({
      resultCount: 1_000_000,
      similarityDensity: 95,
      assetRepetition: 90,
      styleRepetition: 90,
    });
    expect(levelFromIndex(idx)).toBe('RED');
  });

  it('thresholds map correctly', () => {
    expect(levelFromIndex(10)).toBe('GREEN');
    expect(levelFromIndex(40)).toBe('YELLOW');
    expect(levelFromIndex(65)).toBe('ORANGE');
    expect(levelFromIndex(90)).toBe('RED');
  });
});
