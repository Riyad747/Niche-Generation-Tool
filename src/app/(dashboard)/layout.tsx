import { UserButton } from '@clerk/nextjs';
import { Sidebar } from '@/components/layout/sidebar';
import { DeveloperBadge } from '@/components/layout/developer-badge';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b bg-card px-6">
          <div className="text-sm text-muted-foreground">
            AI Microstock Opportunity Intelligence
          </div>
          <UserButton afterSignOutUrl="/" />
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          {children}
          <DeveloperBadge className="mt-10" />
        </main>
      </div>
    </div>
  );
}
