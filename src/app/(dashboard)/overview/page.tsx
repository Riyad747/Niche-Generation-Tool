import Link from 'next/link';
import { requireUser } from '@/lib/auth/require-user';
import { prisma } from '@/lib/db/client';
import { ScoreBadge } from '@/components/scores/score-badge';

/** Overview dashboard — live counts and the user's top opportunities. */
export default async function OverviewPage() {
  const user = await requireUser();

  const [sessionCount, nicheCount, watchCount, topNiches] = await Promise.all([
    prisma.researchSession.count({ where: { userId: user.id } }),
    prisma.niche.count({ where: { userId: user.id, depth: { gt: 0 } } }),
    prisma.watchlist.count({ where: { userId: user.id } }),
    prisma.niche.findMany({
      where: { userId: user.id, depth: { gt: 0 }, opportunityScore: { gt: 0 } },
      orderBy: { opportunityScore: 'desc' },
      take: 5,
      select: {
        id: true,
        name: true,
        sessionId: true,
        opportunityScore: true,
        demandScore: true,
        competitionScore: true,
        aiCompatScore: true,
        vectorCompatScore: true,
      },
    }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Overview</h1>
        <p className="text-sm text-muted-foreground">
          Your opportunity radar.
          {nicheCount === 0 && ' Start a Deep Niche Research run to populate this dashboard.'}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          ['Research sessions', sessionCount],
          ['Niches scored', nicheCount],
          ['Watched targets', watchCount],
        ].map(([label, value]) => (
          <div key={label as string} className="rounded-xl border bg-card p-5">
            <div className="text-sm text-muted-foreground">{label}</div>
            <div className="mt-1 text-3xl font-bold tabular-nums">{value}</div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border bg-card">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="font-semibold">Your top opportunities</h2>
          <Link href="/opportunities" className="text-xs text-primary hover:underline">
            View all
          </Link>
        </div>
        {topNiches.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-muted-foreground">
            No scored niches yet.{' '}
            <Link href="/niches" className="text-primary hover:underline">
              Run your first research
            </Link>{' '}
            — or check the{' '}
            <Link href="/calendar" className="text-primary hover:underline">
              Content Calendar
            </Link>{' '}
            for what&apos;s in season.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground">
              <tr className="border-b">
                <th className="px-5 py-3 font-medium">Niche</th>
                <th className="px-5 py-3 font-medium">Opportunity</th>
                <th className="px-5 py-3 font-medium">Demand</th>
                <th className="px-5 py-3 font-medium">Competition</th>
                <th className="px-5 py-3 font-medium">AI</th>
                <th className="px-5 py-3 font-medium">Vector</th>
              </tr>
            </thead>
            <tbody>
              {topNiches.map((n) => (
                <tr key={n.id} className="border-b last:border-0">
                  <td className="px-5 py-3 font-medium">
                    <Link href={`/niches/${n.sessionId}`} className="hover:underline">
                      {n.name}
                    </Link>
                  </td>
                  <td className="px-5 py-3"><ScoreBadge score={n.opportunityScore} /></td>
                  <td className="px-5 py-3"><ScoreBadge score={n.demandScore} /></td>
                  <td className="px-5 py-3"><ScoreBadge score={100 - n.competitionScore} label="inv" /></td>
                  <td className="px-5 py-3"><ScoreBadge score={n.aiCompatScore} /></td>
                  <td className="px-5 py-3"><ScoreBadge score={n.vectorCompatScore} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
