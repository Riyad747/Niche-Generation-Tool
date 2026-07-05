import { describe, it, expect, beforeAll } from 'vitest';
import { encryptSecret, decryptSecret, maskSecret } from '@/lib/utils/crypto';

beforeAll(() => {
  process.env.APP_ENCRYPTION_KEY = 'test-encryption-seed-1234567890';
});

describe('Secret encryption', () => {
  it('round-trips a value', () => {
    const secret = 'sk-ant-abc123def456ghi789';
    const enc = encryptSecret(secret);
    expect(enc).not.toContain(secret); // ciphertext, not plaintext
    expect(decryptSecret(enc)).toBe(secret);
  });

  it('produces different ciphertext each time (random IV)', () => {
    const a = encryptSecret('same-value');
    const b = encryptSecret('same-value');
    expect(a).not.toBe(b);
    expect(decryptSecret(a)).toBe('same-value');
    expect(decryptSecret(b)).toBe('same-value');
  });

  it('fails to decrypt a tampered payload (auth tag)', () => {
    const enc = encryptSecret('secret');
    const tampered = `${enc.slice(0, -4)}AAAA`;
    expect(() => decryptSecret(tampered)).toThrow();
  });
});

describe('maskSecret', () => {
  it('shows prefix + last 4', () => {
    expect(maskSecret('sk-ant-abcdefghijklmnop')).toBe('sk-ant-…mnop');
  });
  it('fully masks short values', () => {
    expect(maskSecret('short')).toBe('••••');
  });
});
