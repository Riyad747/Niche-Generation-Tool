'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api/client';
import type { NicheContentDto } from '@/types/dto';

export interface UpcomingEventDto {
  id: string;
  name: string;
  category: 'holiday' | 'seasonal' | 'awareness' | 'shopping' | 'cultural';
  date: string;
  daysUntil: number;
  createByDate: string;
  daysUntilCreateBy: number;
  urgency: 'create-now' | 'start-soon' | 'plan-ahead';
  note: string;
  approx?: boolean;
}

export function useCalendar(horizon = 150) {
  return useQuery({
    queryKey: ['calendar', horizon],
    queryFn: () =>
      apiFetch<{ data: UpcomingEventDto[] }>(`/api/calendar?horizon=${horizon}`).then((r) => r.data),
  });
}

export function useEventIdeas() {
  return useMutation({
    mutationFn: (eventId: string) =>
      apiFetch<NicheContentDto>('/api/calendar/ideas', {
        method: 'POST',
        body: JSON.stringify({ eventId }),
      }),
  });
}
