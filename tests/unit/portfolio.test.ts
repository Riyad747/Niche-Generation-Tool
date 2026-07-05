import { describe, it, expect } from 'vitest';
import { parseCsv, parseCsvRecords } from '@/lib/utils/csv';
import { normalizePortfolioCsv } from '@/lib/services/csv-normalize';
import { analyzePortfolio, planNextAssets } from '@/lib/engines/portfolio';

describe('CSV parser', () => {
  it('handles quoted fields with commas and escaped quotes', () => {
    const rows = parseCsv('a,b,c\n"hello, world","she said ""hi""",3');
    expect(rows).toHaveLength(2);
    expect(rows[1]).toEqual(['hello, world', 'she said "hi"', '3']);
  });

  it('parses records keyed by lowercased headers', () => {
    const recs = parseCsvRecords('Title,Keywords\n"Cat","cute, pet"');
    expect(recs[0].title).toBe('Cat');
    expect(recs[0].keywords).toBe('cute, pet');
  });
});

describe('Portfolio CSV normalization', () => {
  it('maps Adobe-style columns and splits keywords', () => {
    const csv =
      'Filename,Title,Keywords,Category\n' +
      'a.jpg,Telemedicine vector icon,"telemedicine, health, vector",Graphic\n' +
      'b.jpg,Mountain landscape photo,"landscape, nature, photo",Photo';
    const assets = normalizePortfolioCsv(csv);
    expect(assets).toHaveLength(2);
    expect(assets[0].keywords).toContain('telemedicine');
    expect(assets[0].assetType).toBe('VECTOR');
    expect(assets[1].assetType).toBe('PHOTO');
  });
});

describe('Portfolio gap analysis', () => {
  const assets = [
    { title: 'Telemedicine icon', keywords: ['telemedicine', 'healthcare'], category: 'Healthcare' },
    { title: 'Mental health art', keywords: ['mental health'], category: 'Healthcare' },
  ];

  it('flags untouched categories as growth gaps and covered leaves lower priority', () => {
    const analysis = analyzePortfolio(assets);
    expect(analysis.total).toBe(2);
    // Healthcare has some coverage; Technology/Nature have none → growth gaps present.
    const growth = analysis.gaps.filter((g) => g.gapType === 'growth');
    expect(growth.length).toBeGreaterThan(0);
    // Telemedicine is covered, so it should not be the top-priority gap.
    expect(analysis.gaps[0].label).not.toBe('Telemedicine');
  });

  it('plans exactly N assets across gaps', () => {
    const analysis = analyzePortfolio(assets);
    const slots = planNextAssets(analysis.gaps, 100);
    const total = slots.reduce((s, x) => s + x.count, 0);
    expect(total).toBe(100);
    expect(slots.every((s) => s.count > 0)).toBe(true);
  });

  it('returns no plan for an empty gap list', () => {
    expect(planNextAssets([], 50)).toEqual([]);
  });
});
