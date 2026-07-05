import { TAXONOMY } from '@/config/taxonomy';

export interface PortfolioAssetLike {
  title: string;
  keywords: string[];
  category?: string | null;
}

export type PortfolioGapType = 'missing' | 'weak' | 'growth';

export interface PortfolioGapItem {
  category: string;
  label: string; // the specific sub-niche
  gapType: PortfolioGapType;
  coverageCount: number;
  priority: number; // 0..100, higher = fill sooner
}

export interface PortfolioAnalysis {
  total: number;
  categoryDistribution: Record<string, number>;
  gaps: PortfolioGapItem[];
}

/** Lowercased haystack for matching an asset against niche names. */
function assetText(a: PortfolioAssetLike): string {
  return `${a.title} ${a.keywords.join(' ')} ${a.category ?? ''}`.toLowerCase();
}

function matches(text: string, term: string): boolean {
  return text.includes(term.toLowerCase());
}

/**
 * Portfolio Gap engine — classifies each asset against the taxonomy by keyword
 * match, then finds missing / weak / growth gaps. Pure and deterministic so the
 * "what should I make next" logic is fully unit-tested; the AI only fills in
 * prompts for the resulting slots later.
 */
export function analyzePortfolio(
  assets: PortfolioAssetLike[],
  taxonomy: Record<string, string[]> = TAXONOMY,
): PortfolioAnalysis {
  const texts = assets.map(assetText);
  const categoryDistribution: Record<string, number> = {};
  const leafCounts: Record<string, { category: string; count: number }> = {};

  for (const [category, leaves] of Object.entries(taxonomy)) {
    categoryDistribution[category] = 0;
    for (const leaf of leaves) leafCounts[leaf] = { category, count: 0 };
  }

  for (const text of texts) {
    for (const [category, leaves] of Object.entries(taxonomy)) {
      let hitCategory = matches(text, category);
      for (const leaf of leaves) {
        if (matches(text, leaf)) {
          leafCounts[leaf].count++;
          hitCategory = true;
        }
      }
      if (hitCategory) categoryDistribution[category]++;
    }
  }

  const leafValues = Object.values(leafCounts).map((l) => l.count);
  const avg = leafValues.reduce((a, b) => a + b, 0) / Math.max(leafValues.length, 1);
  const weakThreshold = Math.max(1, avg * 0.5);

  const gaps: PortfolioGapItem[] = Object.entries(leafCounts).map(([label, { category, count }]) => {
    const categoryEmpty = categoryDistribution[category] === 0;
    let gapType: PortfolioGapType;
    if (count === 0) gapType = categoryEmpty ? 'growth' : 'missing';
    else if (count < weakThreshold) gapType = 'weak';
    else gapType = 'weak'; // covered leaves still returned but low priority

    // Priority: empty categories and missing leaves first, weak next.
    const base = count === 0 ? (categoryEmpty ? 90 : 70) : Math.max(0, 50 - count * 5);
    return { category, label, gapType, coverageCount: count, priority: Math.min(100, base) };
  });

  gaps.sort((a, b) => b.priority - a.priority);
  return { total: assets.length, categoryDistribution, gaps };
}

export interface PlanSlot {
  category: string;
  label: string;
  count: number;
}

/**
 * Allocate `size` assets across the top gaps, weighted by priority. Returns
 * slots summing to exactly `size` (largest-remainder rounding).
 */
export function planNextAssets(gaps: PortfolioGapItem[], size: number): PlanSlot[] {
  const top = gaps.filter((g) => g.priority > 0).slice(0, Math.min(gaps.length, 40));
  if (top.length === 0 || size <= 0) return [];

  const weightTotal = top.reduce((s, g) => s + g.priority, 0);
  const raw = top.map((g) => ({ g, exact: (g.priority / weightTotal) * size }));
  const slots = raw.map((r) => ({
    category: r.g.category,
    label: r.g.label,
    count: Math.floor(r.exact),
    remainder: r.exact - Math.floor(r.exact),
  }));

  let allocated = slots.reduce((s, x) => s + x.count, 0);
  slots.sort((a, b) => b.remainder - a.remainder);
  for (let i = 0; allocated < size; i++, allocated++) slots[i % slots.length].count++;

  return slots
    .filter((s) => s.count > 0)
    .map(({ category, label, count }) => ({ category, label, count }));
}
