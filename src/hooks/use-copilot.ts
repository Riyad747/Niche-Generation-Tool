'use client';

import { useMutation } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api/client';

export interface CopilotReply {
  answer: string;
  toolUsed: string;
  data?: unknown;
}

export function useCopilot() {
  return useMutation({
    mutationFn: (message: string) =>
      apiFetch<CopilotReply>('/api/copilot/chat', {
        method: 'POST',
        body: JSON.stringify({ message }),
      }),
  });
}
