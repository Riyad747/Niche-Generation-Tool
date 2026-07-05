import { cn } from '@/lib/utils/cn';
import { scoreColor } from './score-badge';
import type { NicheDto } from '@/types/dto';

const ROWS: { key: keyof NicheDto; label: string; invert?: boolean }[] = [
  { key: 'demandScore', label: 'Demand' },
  { key: 'competitionScore', label: 'Competition', invert: true },
  { key: 'trendScore', label: 'Trend' },
  { key: 'seasonalityScore', label: 'Seasonality' },
  { key: 'aiCompatScore', label: 'AI compatibility' },
  { key: 'vectorCompatScore', label: 'Vectorization' },
  { key: 'commercialSafetyScore', label: 'Commercial safety' },
  { key: 'approvalProbabilityScore', label: 'Approval probability' },
];

/** Bar list of the eight sub-scores. Competition is shown inverted (higher bar = better). */
export function ScoreBreakdown({ niche }: { niche: NicheDto }) {
  return (
    <div className="space-y-2.5">
      {ROWS.map(({ key, label, invert }) => {
        const raw = niche[key] as number;
        const shown = invert ? 100 - raw : raw;
        return (
          <div key={key} className="flex items-center gap-3 text-sm">
            <span className="w-40 shrink-0 text-muted-foreground">{label}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className={cn('h-full rounded-full', barColor(shown))}
                style={{ width: `${shown}%` }}
              />
            </div>
            <span className={cn('w-8 text-right font-semibold tabular-nums', scoreColor(shown))}>
              {raw}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function barColor(score: number): string {
  if (score >= 75) return 'bg-score-green';
  if (score >= 50) return 'bg-score-yellow';
  if (score >= 25) return 'bg-score-orange';
  return 'bg-score-red';
}
