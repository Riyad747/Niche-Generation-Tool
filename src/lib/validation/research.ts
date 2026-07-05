import { z } from 'zod';
import { EXPANSION } from '@/config/constants';

export const createSessionSchema = z.object({
  seed: z.string().min(2).max(80),
  projectId: z.string().optional(),
  depth: z.number().int().min(1).max(EXPANSION.MAX_DEPTH).optional(),
  breadth: z.number().int().min(2).max(EXPANSION.MAX_BREADTH).optional(),
});
export type CreateSessionInput = z.infer<typeof createSessionSchema>;
