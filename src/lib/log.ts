/**
 * Minimal structured logger — JSON lines to stdout, which Vercel/most log
 * drains parse natively. Avoids a heavy dependency while giving consistent,
 * queryable logs (level, msg, request id, timing, arbitrary fields).
 */
type Level = 'debug' | 'info' | 'warn' | 'error';

function emit(level: Level, msg: string, fields?: Record<string, unknown>) {
  const line = JSON.stringify({ level, msg, ts: new Date().toISOString(), ...fields });
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}

export const log = {
  debug: (msg: string, f?: Record<string, unknown>) => emit('debug', msg, f),
  info: (msg: string, f?: Record<string, unknown>) => emit('info', msg, f),
  warn: (msg: string, f?: Record<string, unknown>) => emit('warn', msg, f),
  error: (msg: string, f?: Record<string, unknown>) => emit('error', msg, f),
};

/** Short random-ish id for correlating a request's logs (crypto-based). */
export function requestId(): string {
  return crypto.randomUUID().slice(0, 8);
}
