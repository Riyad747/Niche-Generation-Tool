import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db/client';

/**
 * Resolve the current app User from the Clerk session, creating the row on
 * first sight (defensive — the Clerk webhook is the primary sync path).
 * Throws `UnauthorizedError` when there's no session; route handlers map that
 * to a 401.
 */
export class UnauthorizedError extends Error {
  constructor() {
    super('Unauthorized');
    this.name = 'UnauthorizedError';
  }
}

export async function requireUser() {
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new UnauthorizedError();

  const user = await prisma.user.upsert({
    where: { clerkId },
    update: {},
    create: { clerkId, email: `${clerkId}@pending.local` },
  });
  return user;
}
