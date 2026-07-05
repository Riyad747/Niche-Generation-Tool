import { requireUser } from '@/lib/auth/require-user';
import { prisma } from '@/lib/db/client';

/** Settings — account plan + this-period AI usage. Billing wiring comes in Phase 5. */
export default async function SettingsPage() {
  const user = await requireUser();
  const usage = await prisma.aiUsage.aggregate({
    where: { userId: user.id },
    _sum: { costUsd: true, inputTok: true, outputTok: true },
  });

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">Account and usage.</p>
      </div>

      <div className="rounded-xl border bg-card p-5">
        <h2 className="font-semibold">Plan</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Current plan: <span className="font-medium text-foreground">{user.plan}</span>
        </p>
      </div>

      <div className="rounded-xl border bg-card p-5">
        <h2 className="font-semibold">AI usage</h2>
        <dl className="mt-3 grid grid-cols-3 gap-4 text-sm">
          <div>
            <dt className="text-muted-foreground">Total cost</dt>
            <dd className="text-lg font-bold tabular-nums">
              ${Number(usage._sum.costUsd ?? 0).toFixed(2)}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Input tokens</dt>
            <dd className="text-lg font-bold tabular-nums">{usage._sum.inputTok ?? 0}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Output tokens</dt>
            <dd className="text-lg font-bold tabular-nums">{usage._sum.outputTok ?? 0}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
