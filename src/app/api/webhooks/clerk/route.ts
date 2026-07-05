import type { NextRequest } from 'next/server';
import { verifyWebhook } from '@clerk/nextjs/webhooks';
import { prisma } from '@/lib/db/client';
import { log } from '@/lib/log';

/**
 * Clerk webhook — the primary User-sync path. Uses Clerk's built-in Svix
 * verification (reads CLERK_WEBHOOK_SECRET), then upserts/deletes the app User
 * on user.created / user.updated / user.deleted. Public in middleware; security
 * comes from signature verification.
 */
export async function POST(req: NextRequest) {
  let evt: Awaited<ReturnType<typeof verifyWebhook>>;
  try {
    evt = await verifyWebhook(req);
  } catch (err) {
    log.warn('clerk.webhook.invalid', { err: String(err) });
    return Response.json({ error: 'invalid signature' }, { status: 400 });
  }

  const data = evt.data as {
    id: string;
    email_addresses?: { email_address: string }[];
    first_name?: string | null;
    last_name?: string | null;
  };
  const email = data.email_addresses?.[0]?.email_address;
  const name = [data.first_name, data.last_name].filter(Boolean).join(' ') || null;

  switch (evt.type) {
    case 'user.created':
    case 'user.updated':
      await prisma.user.upsert({
        where: { clerkId: data.id },
        update: { email: email ?? undefined, name },
        create: { clerkId: data.id, email: email ?? `${data.id}@pending.local`, name },
      });
      break;
    case 'user.deleted':
      await prisma.user.deleteMany({ where: { clerkId: data.id } });
      break;
  }

  log.info('clerk.webhook', { type: evt.type });
  return Response.json({ ok: true });
}
