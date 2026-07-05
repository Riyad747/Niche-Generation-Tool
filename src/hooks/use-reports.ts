'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api/client';

export interface ReportListItem {
  id: string;
  kind: string;
  title: string;
  createdAt: string;
}

export interface ReportContent {
  generatedAt: string;
  kind: string;
  summary: string;
  highlights: { label: string; value: string }[];
  opportunities: { name: string; opportunityScore: number; gap: string; growthState: string | null }[];
}

export function useReports() {
  return useQuery({
    queryKey: ['reports'],
    queryFn: () => apiFetch<{ data: ReportListItem[] }>('/api/reports').then((r) => r.data),
  });
}

export function useReport(id: string | null) {
  return useQuery({
    queryKey: ['report', id],
    enabled: !!id,
    queryFn: () => apiFetch<{ content: ReportContent; title: string }>(`/api/reports/${id}`),
  });
}

export function useGenerateReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (kind: string) =>
      apiFetch<{ id: string }>('/api/reports', { method: 'POST', body: JSON.stringify({ kind }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reports'] }),
  });
}
