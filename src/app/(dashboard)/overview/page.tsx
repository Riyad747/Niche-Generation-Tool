import { ScoreBadge } from '@/components/scores/score-badge';

/**
 * Overview dashboard — Phase 0 stub. Wires the layout + design system.
 * Real data (recent sessions, top opportunities, watchlist deltas) lands in
 * Phase 1–4 via React Query hooks; see docs/05-ROADMAP.md.
 */
const demoOpportunities = [
  { niche: 'Telemedicine icon sets', opp: 82, demand: 78, comp: 24, ai: 88, vector: 91 },
  { niche: 'Elderly care illustrations', opp: 76, demand: 71, comp: 33, ai: 80, vector: 74 },
  { niche: 'Mental health line art', opp: 73, demand: 69, comp: 41, ai: 85, vector: 83 },
];

export default function OverviewPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Overview</h1>
        <p className="text-sm text-muted-foreground">
          Your opportunity radar. Start a Deep Niche Research run to populate this dashboard.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          ['Research sessions', '—'],
          ['Opportunities found', '—'],
          ['Watchlist alerts', '—'],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border bg-card p-5">
            <div className="text-sm text-muted-foreground">{label}</div>
            <div className="mt-1 text-3xl font-bold tabular-nums">{value}</div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border bg-card">
        <div className="border-b px-5 py-4">
          <h2 className="font-semibold">Top opportunities (demo)</h2>
        </div>
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
            {demoOpportunities.map((o) => (
              <tr key={o.niche} className="border-b last:border-0">
                <td className="px-5 py-3 font-medium">{o.niche}</td>
                <td className="px-5 py-3">
                  <ScoreBadge score={o.opp} />
                </td>
                <td className="px-5 py-3">
                  <ScoreBadge score={o.demand} />
                </td>
                <td className="px-5 py-3">
                  <ScoreBadge score={100 - o.comp} label="inv" />
                </td>
                <td className="px-5 py-3">
                  <ScoreBadge score={o.ai} />
                </td>
                <td className="px-5 py-3">
                  <ScoreBadge score={o.vector} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
