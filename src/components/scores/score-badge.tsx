import { cn } from '@/lib/utils/cn';

/** Maps a 0..100 score to the traffic-light palette used across the app. */
export function scoreColor(score: number): string {
  if (score >= 75) return 'text-score-green';
  if (score >= 50) return 'text-score-yellow';
  if (score >= 25) return 'text-score-orange';
  return 'text-score-red';
}

function scoreBg(score: number): string {
  if (score >= 75) return 'bg-score-green/15 text-score-green';
  if (score >= 50) return 'bg-score-yellow/15 text-score-yellow';
  if (score >= 25) return 'bg-score-orange/15 text-score-orange';
  return 'bg-score-red/15 text-score-red';
}

export function ScoreBadge({
  score,
  label,
  className,
}: {
  score: number;
  label?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums',
        scoreBg(score),
        className,
      )}
    >
      {label && <span className="font-normal opacity-80">{label}</span>}
      {score}
    </span>
  );
}
