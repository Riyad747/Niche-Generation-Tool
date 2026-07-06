'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  CalendarClock,
  Network,
  TrendingUp,
  LineChart,
  Image as ImageIcon,
  Wand2,
  FolderKanban,
  Eye,
  FileText,
  Bot,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const NAV = [
  { href: '/overview', label: 'Overview', icon: LayoutDashboard },
  { href: '/calendar', label: 'Content Calendar', icon: CalendarClock },
  { href: '/niches', label: 'Niche Explorer', icon: Network },
  { href: '/opportunities', label: 'Opportunities', icon: TrendingUp },
  { href: '/trends', label: 'Trends', icon: LineChart },
  { href: '/image', label: 'Image Analyzer', icon: ImageIcon },
  { href: '/prompts', label: 'Prompt Generator', icon: Wand2 },
  { href: '/portfolio', label: 'Portfolio', icon: FolderKanban },
  { href: '/watchlist', label: 'Watchlist', icon: Eye },
  { href: '/reports', label: 'Reports', icon: FileText },
  { href: '/copilot', label: 'AI Copilot', icon: Bot },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden w-60 shrink-0 border-r bg-card md:block">
      <div className="px-5 py-5">
        <span className="text-sm font-bold leading-tight">
          Microstock
          <br />
          <span className="text-primary">Opportunity AI</span>
        </span>
      </div>
      <nav className="space-y-1 px-3">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
