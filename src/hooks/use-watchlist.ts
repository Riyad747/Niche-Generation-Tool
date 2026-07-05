'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api/client';

export interface WatchItem {
  id: string;
  target: string;
  targetType: string;
  latest: {
    opportunityScore: number;
    demandScore: number;
    competitionScore: number;
    trendScore: number;
  } | null;
  delta: { opportunity: number; demand: number; competition: number; trend: number } | null;
}

export function useWatchlist() {
  return useQuery({
    queryKey: ['watchlist'],
    queryFn: () => apiFetch<{ data: WatchItem[] }>('/api/watchlists').then((r) => r.data),
  });
}

export function useAddWatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (target: string) =>
      apiFetch<{ id: string }>('/api/watchlists', {
        method: 'POST',
        body: JSON.stringify({ target }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['watchlist'] }),
  });
}

export function useRemoveWatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/api/watchlists/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['watchlist'] }),
  });
}
