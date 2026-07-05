'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api/client';
import type { SessionDto, NicheDto, NicheContentDto } from '@/types/dto';

export function useCreateResearchSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { seed: string; depth?: number; breadth?: number }) =>
      apiFetch<{ id: string; status: string }>('/api/research/sessions', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sessions'] }),
  });
}

export function useSessions() {
  return useQuery({
    queryKey: ['sessions'],
    queryFn: () => apiFetch<{ data: SessionDto[] }>('/api/research/sessions').then((r) => r.data),
  });
}

/** Polls the session until it's finished so the UI can show live progress. */
export function useSession(id: string | null) {
  return useQuery({
    queryKey: ['session', id],
    enabled: !!id,
    queryFn: () => apiFetch<SessionDto>(`/api/research/sessions/${id}`),
    refetchInterval: (q) => {
      const s = q.state.data?.status;
      return s === 'COMPLETE' || s === 'FAILED' ? false : 1500;
    },
  });
}

export function useNiches(sessionId: string | null, live: boolean) {
  return useQuery({
    queryKey: ['niches', sessionId],
    enabled: !!sessionId,
    queryFn: () =>
      apiFetch<{ data: NicheDto[] }>(`/api/research/sessions/${sessionId}/niches`).then((r) => r.data),
    refetchInterval: live ? 2500 : false,
  });
}

export function useNicheContent() {
  return useMutation({
    mutationFn: (nicheId: string) =>
      apiFetch<NicheContentDto>(`/api/niches/${nicheId}/content`, { method: 'POST' }),
  });
}
