import type { ZodType } from 'zod';

/** Validate raw model text as JSON against a zod schema (tolerant of fences/prose). */
export function validateJson<T>(schema: ZodType<T>, raw: string): T {
  return schema.parse(extractJson(raw));
}

/** Tolerate stray markdown fences or leading prose around the JSON body. */
export function extractJson(raw: string): unknown {
  const trimmed = raw.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.search(/[[{]/);
    const end = Math.max(trimmed.lastIndexOf('}'), trimmed.lastIndexOf(']'));
    if (start >= 0 && end > start) return JSON.parse(trimmed.slice(start, end + 1));
    throw new Error('No JSON object found in model output');
  }
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
