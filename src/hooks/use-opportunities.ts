'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api/client';

export type DiscoveryWindow = 'day' | 'week' | 'month' | 'all';

export interface OpportunityDto {
  id: string;
  name: string;
  description: string | null;
  opportunityScore: number;
  demandScore: number;
  competitionScore: number;
  trendScore: number;
  aiCompatScore: number;
  vectorCompatScore: number;
  approvalProbabilityScore: number;
  growthState: string | null;
  saturation: string | null;
  gap: 'overserved' | 'underserved' | 'unexplored' | 'future';
  sessionId: string;
}

export function useOpportunities(window: DiscoveryWindow) {
  return useQuery({
    queryKey: ['opportunities', window],
    queryFn: () =>
      apiFetch<{ window: DiscoveryWindow; data: OpportunityDto[] }>(
        `/api/opportunities?window=${window}`,
      ).then((r) => r.data),
  });
}
