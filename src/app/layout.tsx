import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { QueryProvider } from '@/components/providers/query-provider';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Microstock Opportunity Intelligence',
  description:
    'AI-powered opportunity discovery for microstock creators — find high-demand, low-competition, AI- and vectorization-friendly niches.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className="min-h-screen antialiased">
          <QueryProvider>{children}</QueryProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
