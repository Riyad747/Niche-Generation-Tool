import Link from 'next/link';
import { DeveloperBadge } from '@/components/layout/developer-badge';

const modes = [
  ['Deep Niche Research', 'Expand a seed niche into a scored, ranked opportunity tree.'],
  ['Market Discovery', 'Top opportunities today, this week, and this month.'],
  ['Image → Opportunity', 'Turn any image into niches, prompts, and keywords.'],
  ['Portfolio Gaps', 'Upload a CSV, find what you should create next.'],
];

export default function LandingPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-24">
      <p className="mb-3 text-sm font-medium uppercase tracking-widest text-primary">
        For microstock creators
      </p>
      <h1 className="max-w-3xl text-5xl font-bold leading-tight tracking-tight">
        Stop guessing what to create. Find profitable niches with AI.
      </h1>
      <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
        One unified Opportunity Score fuses demand, competition, trend growth, AI-generatability,
        vectorization success, and Adobe-approval probability — so you always know what to make next.
      </p>

      <div className="mt-8 flex gap-4">
        <Link
          href="/sign-up"
          className="rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground"
        >
          Get started
        </Link>
        <Link
          href="/sign-in"
          className="rounded-lg border px-6 py-3 font-medium"
        >
          Sign in
        </Link>
      </div>

      <div className="mt-16 grid gap-4 sm:grid-cols-2">
        {modes.map(([title, desc]) => (
          <div key={title} className="rounded-xl border bg-card p-6">
            <h3 className="font-semibold">{title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
          </div>
        ))}
      </div>

      <footer className="mt-24 border-t">
        <DeveloperBadge />
      </footer>
    </main>
  );
}
