import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

/** Public routes; everything else requires an authenticated session. */
const isPublic = createRouteMatcher([
  '/',
  '/pricing',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
  '/api/jobs(.*)', // QStash callbacks are signature-verified, not Clerk-guarded
  '/api/cron(.*)', // Vercel Cron; guarded by CRON_SECRET
  '/api/health',
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublic(req)) await auth.protect();
});

export const config = {
  matcher: ['/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpg|png|svg|ico)).*)', '/(api|trpc)(.*)'],
};
