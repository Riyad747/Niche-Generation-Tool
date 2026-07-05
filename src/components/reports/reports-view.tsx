'use client';

import { useState } from 'react';
import { useReports, useReport, useGenerateReport } from '@/hooks/use-reports';
import { ScoreBadge } from '@/components/scores/score-badge';

const KINDS = ['DAILY', 'WEEKLY', 'MONTHLY'];

/** Reports — generate and view opportunity reports. */
export function ReportsView() {
  const list = useReports();
  const generate = useGenerateReport();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const report = useReport(selectedId);

  async function gen(kind: string) {
    const res = await generate.mutateAsync(kind);
    setSelectedId(res.id);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="text-sm text-muted-foreground">Generate opportunity reports from your data.</p>
        </div>
        <div className="flex gap-2">
          {KINDS.map((k) => (
            <button
              key={k}
              onClick={() => gen(k)}
              disabled={generate.isPending}
              className="rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-50"
            >
              {generate.isPending ? '…' : k}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="space-y-1.5">
          {list.data?.map((r) => (
            <button
              key={r.id}
              onClick={() => setSelectedId(r.id)}
              className={`w-full rounded-lg border px-3 py-2 text-left text-sm hover:bg-muted/50 ${
                selectedId === r.id ? 'border-primary bg-primary/5' : ''
              }`}
            >
              <div className="font-medium">{r.title}</div>
              <div className="text-xs text-muted-foreground">{r.kind}</div>
            </button>
          ))}
          {list.data?.length === 0 && (
            <p className="text-sm text-muted-foreground">No reports yet — generate one above.</p>
          )}
        </div>

        <div>
          {report.data ? (
            <div className="space-y-5">
              <h2 className="text-lg font-bold">{report.data.title}</h2>
              <p className="rounded-xl border bg-card p-4 text-sm">{report.data.content.summary}</p>
              <div className="grid grid-cols-3 gap-3">
                {report.data.content.highlights.map((h) => (
                  <div key={h.label} className="rounded-xl border bg-card p-3 text-center">
                    <div className="text-xs text-muted-foreground">{h.label}</div>
                    <div className="mt-1 text-2xl font-bold tabular-nums">{h.value}</div>
                  </div>
                ))}
              </div>
              <div className="overflow-hidden rounded-xl border bg-card">
                <table className="w-full text-sm">
                  <thead className="text-left text-muted-foreground">
                    <tr className="border-b">
                      <th className="px-4 py-2 font-medium">Niche</th>
                      <th className="px-3 py-2 font-medium">Score</th>
                      <th className="px-3 py-2 font-medium">Gap</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.data.content.opportunities.map((o, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="px-4 py-2">{o.name}</td>
                        <td className="px-3 py-2"><ScoreBadge score={o.opportunityScore} /></td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">{o.gap}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
              Select or generate a report.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
