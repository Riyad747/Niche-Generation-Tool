import { portfolioRepo } from '@/lib/db/repositories/portfolio-repo';
import { normalizePortfolioCsv } from './csv-normalize';
import {
  analyzePortfolio,
  planNextAssets,
  type PortfolioGapItem,
  type PlanSlot,
} from '@/lib/engines/portfolio';
import type { AssetType, Prisma } from '@prisma/client';

/**
 * PortfolioService (Mode 4) — parse a contributor CSV, persist assets, detect
 * missing/weak/growth gaps, and produce a Next-N asset plan. Gap detection and
 * planning are pure engine calls; this service handles persistence + mapping.
 */
export class PortfolioService {
  /** Process an uploaded CSV: normalize, store assets, compute + store gaps. */
  async process(uploadId: string, csv: string): Promise<void> {
    try {
      const assets = normalizePortfolioCsv(csv);

      await portfolioRepo.addAssets(
        assets.map((a) => ({
          uploadId,
          title: a.title || null,
          category: a.category,
          assetType: (a.assetType as AssetType | null) ?? null,
          keywords: a.keywords,
        })),
      );

      const analysis = analyzePortfolio(assets);
      const gapRows: Prisma.PortfolioGapCreateManyInput[] = analysis.gaps
        .filter((g) => g.priority > 0)
        .slice(0, 60)
        .map((g) => ({
          uploadId,
          label: g.label,
          gapType: g.gapType,
          opportunityScore: g.priority,
          suggestedCount: suggestedForGap(g),
          rationale: { category: g.category, coverageCount: g.coverageCount } as Prisma.InputJsonValue,
        }));
      await portfolioRepo.replaceGaps(uploadId, gapRows);

      await portfolioRepo.updateUpload(uploadId, {
        status: 'COMPLETE',
        rowCount: assets.length,
        summary: {
          total: analysis.total,
          categoryDistribution: analysis.categoryDistribution,
        } as Prisma.InputJsonValue,
      });
    } catch (err) {
      await portfolioRepo.updateUpload(uploadId, { status: 'FAILED' });
      throw err;
    }
  }

  /** Next 50/100/500 asset plan from stored gaps. */
  async plan(uploadId: string, userId: string, size: number): Promise<PlanSlot[]> {
    const upload = await portfolioRepo.getUpload(uploadId, userId);
    if (!upload) throw new Error('Upload not found');
    const gaps = await portfolioRepo.listGaps(uploadId);
    const items: PortfolioGapItem[] = gaps.map((g) => ({
      category: (g.rationale as { category?: string })?.category ?? 'Uncategorized',
      label: g.label,
      gapType: g.gapType as PortfolioGapItem['gapType'],
      coverageCount: (g.rationale as { coverageCount?: number })?.coverageCount ?? 0,
      priority: g.opportunityScore,
    }));
    return planNextAssets(items, size);
  }
}

function suggestedForGap(g: PortfolioGapItem): number {
  if (g.gapType === 'growth') return 30;
  if (g.gapType === 'missing') return 15;
  return 8;
}
