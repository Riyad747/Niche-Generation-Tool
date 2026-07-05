'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api/client';

export interface PortfolioGapDto {
  id: string;
  label: string;
  gapType: string;
  opportunityScore: number;
  suggestedCount: number;
  rationale: { category?: string; coverageCount?: number } | null;
}

export interface GapsResponse {
  status: string;
  summary: { total: number; categoryDistribution: Record<string, number> } | null;
  gaps: PortfolioGapDto[];
}

export interface PlanSlot {
  category: string;
  label: string;
  count: number;
}

export function useUploadPortfolio() {
  return useMutation({
    mutationFn: (input: { csv: string; platform: string; fileName: string }) =>
      apiFetch<{ id: string }>('/api/portfolio/uploads', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
  });
}

export function usePortfolioGaps(uploadId: string | null) {
  return useQuery({
    queryKey: ['portfolio-gaps', uploadId],
    enabled: !!uploadId,
    queryFn: () => apiFetch<GapsResponse>(`/api/portfolio/${uploadId}/gaps`),
  });
}

export function usePortfolioPlan(uploadId: string | null, size: number) {
  return useQuery({
    queryKey: ['portfolio-plan', uploadId, size],
    enabled: !!uploadId,
    queryFn: () =>
      apiFetch<{ size: number; slots: PlanSlot[] }>(`/api/portfolio/${uploadId}/plan?size=${size}`),
  });
}
