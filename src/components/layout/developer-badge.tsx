import { cn } from '@/lib/utils/cn';

/** Small attribution badge shown at the bottom of pages. */
export function DeveloperBadge({ className }: { className?: string }) {
  return (
    <p className={cn('py-6 text-center text-xs text-muted-foreground', className)}>
      Developed by <span className="font-semibold text-foreground">RIYAD</span>
    </p>
  );
}
