import type { AiClient } from '@/lib/ai/client';
import { modelFor } from '@/lib/ai/model-policy';
import { reportRepo } from '@/lib/db/repositories/report-repo';
import { DiscoveryService } from './discovery.service';
import type { ReportKind, Prisma } from '@prisma/client';

export interface ReportContent {
  generatedAt: string;
  kind: ReportKind;
  summary: string;
  highlights: { label: string; value: string }[];
  opportunities: { name: string; opportunityScore: number; gap: string; growthState: string | null }[];
}

/**
 * ReportService — assembles a report from the user's existing scored data
 * (deterministic) and adds a short AI-written executive summary. `now` is
 * injected for testable, reproducible generation.
 */
export class ReportService {
  constructor(private ai: AiClient) {}

  async generate(userId: string, kind: ReportKind, now: Date) {
    const window = kind === 'DAILY' ? 'day' : kind === 'WEEKLY' ? 'week' : 'month';
    const opportunities = await new DiscoveryService().top(userId, window, now, 15);

    const gapCounts = opportunities.reduce<Record<string, number>>((acc, o) => {
      acc[o.gap] = (acc[o.gap] ?? 0) + 1;
      return acc;
    }, {});

    const highlights = [
      { label: 'Opportunities', value: String(opportunities.length) },
      { label: 'Underserved', value: String(gapCounts.underserved ?? 0) },
      { label: 'Top score', value: String(opportunities[0]?.opportunityScore ?? 0) },
    ];

    const summary =
      opportunities.length === 0
        ? 'No scored opportunities in this window yet. Run a niche research to populate reports.'
        : await this.ai
            .text({
              system:
                'Write a 2-3 sentence executive summary for a microstock creator’s opportunity ' +
                'report. Be concrete, reference the strongest niches and any underserved gaps.',
              user: JSON.stringify(
                opportunities.slice(0, 10).map((o) => ({
                  name: o.name,
                  score: o.opportunityScore,
                  gap: o.gap,
                  growth: o.growthState,
                })),
              ),
              model: modelFor('title'),
              engine: 'report',
            })
            .catch(() => 'Summary unavailable.');

    const content: ReportContent = {
      generatedAt: now.toISOString(),
      kind,
      summary,
      highlights,
      opportunities: opportunities.map((o) => ({
        name: o.name,
        opportunityScore: o.opportunityScore,
        gap: o.gap,
        growthState: o.growthState,
      })),
    };

    const title = `${titleFor(kind)} — ${now.toISOString().slice(0, 10)}`;
    return reportRepo.create({
      userId,
      kind,
      title,
      content: content as unknown as Prisma.InputJsonValue,
    });
  }
}

function titleFor(kind: ReportKind): string {
  const map: Record<ReportKind, string> = {
    DAILY: 'Daily opportunity report',
    WEEKLY: 'Weekly opportunity report',
    MONTHLY: 'Monthly opportunity report',
    OPPORTUNITY: 'Opportunity report',
    TREND: 'Trend report',
    PORTFOLIO: 'Portfolio report',
  };
  return map[kind];
}
