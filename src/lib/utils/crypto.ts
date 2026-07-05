import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

/**
 * Symmetric encryption for secrets at rest (user-provided API keys).
 * AES-256-GCM. The 32-byte key is derived from APP_ENCRYPTION_KEY if set,
 * otherwise from CLERK_SECRET_KEY (always present) so no extra env var is
 * required to ship. Payload format: base64(iv[12] | authTag[16] | ciphertext).
 */
function key(): Buffer {
  const seed =
    process.env.APP_ENCRYPTION_KEY || process.env.CLERK_SECRET_KEY || 'dev-insecure-fallback-key';
  return createHash('sha256').update(seed).digest(); // 32 bytes
}

export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key(), iv);
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString('base64');
}

export function decryptSecret(payload: string): string {
  const buf = Buffer.from(payload, 'base64');
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const enc = buf.subarray(28);
  const decipher = createDecipheriv('aes-256-gcm', key(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
}

/** Mask a key for display: keep the prefix and last 4 chars. */
export function maskSecret(value: string): string {
  if (value.length <= 12) return '••••';
  return `${value.slice(0, 7)}…${value.slice(-4)}`;
}
