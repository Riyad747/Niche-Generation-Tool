import { prisma } from '@/lib/db/client';
import { encryptSecret, decryptSecret, maskSecret } from '@/lib/utils/crypto';

export interface ProviderKeys {
  anthropicKey?: string;
  openaiKey?: string;
  /** One or more Gemini keys — rotated for throughput / rate-limit failover. */
  geminiKeys: string[];
}

export interface KeyStatus {
  anthropic: { set: boolean; masked: string | null };
  openai: { set: boolean; masked: string | null };
  gemini: { count: number; masked: string[] };
}

/**
 * SecretsService — stores/retrieves a user's own AI provider keys, encrypted at
 * rest. Gemini supports a LIST of keys (stored as an encrypted JSON array) so a
 * user can add several free keys; the client rotates across them and fails over
 * on rate limits. `status` returns only masked previews for the settings UI.
 */
export const secretsService = {
  async getKeys(userId: string): Promise<ProviderKeys> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { anthropicKeyEnc: true, openaiKeyEnc: true, geminiKeyEnc: true },
    });
    if (!user) return { geminiKeys: [] };
    return {
      anthropicKey: user.anthropicKeyEnc ? safeDecrypt(user.anthropicKeyEnc) : undefined,
      openaiKey: user.openaiKeyEnc ? safeDecrypt(user.openaiKeyEnc) : undefined,
      geminiKeys: parseKeyList(user.geminiKeyEnc ? safeDecrypt(user.geminiKeyEnc) : undefined),
    };
  },

  async status(userId: string): Promise<KeyStatus> {
    const keys = await this.getKeys(userId);
    return {
      anthropic: keys.anthropicKey
        ? { set: true, masked: maskSecret(keys.anthropicKey) }
        : { set: false, masked: null },
      openai: keys.openaiKey
        ? { set: true, masked: maskSecret(keys.openaiKey) }
        : { set: false, masked: null },
      gemini: { count: keys.geminiKeys.length, masked: keys.geminiKeys.map(maskSecret) },
    };
  },

  /**
   * Save keys. For Gemini, `geminiKeys` REPLACES the whole list (empty array
   * clears it). `undefined` leaves a provider untouched.
   */
  async setKeys(
    userId: string,
    input: { anthropicKey?: string; openaiKey?: string; geminiKeys?: string[] },
  ) {
    const data: {
      anthropicKeyEnc?: string | null;
      openaiKeyEnc?: string | null;
      geminiKeyEnc?: string | null;
    } = {};
    if (input.anthropicKey !== undefined) {
      data.anthropicKeyEnc = input.anthropicKey ? encryptSecret(input.anthropicKey) : null;
    }
    if (input.openaiKey !== undefined) {
      data.openaiKeyEnc = input.openaiKey ? encryptSecret(input.openaiKey) : null;
    }
    if (input.geminiKeys !== undefined) {
      const clean = input.geminiKeys.map((k) => k.trim()).filter(Boolean);
      data.geminiKeyEnc = clean.length ? encryptSecret(JSON.stringify(clean)) : null;
    }
    await prisma.user.update({ where: { id: userId }, data });
  },

  /** Append one Gemini key (de-duplicated). */
  async addGeminiKey(userId: string, key: string) {
    const cur = (await this.getKeys(userId)).geminiKeys;
    const trimmed = key.trim();
    if (trimmed && !cur.includes(trimmed)) cur.push(trimmed);
    await this.setKeys(userId, { geminiKeys: cur });
  },

  /** Remove the Gemini key at `index` (the UI only knows masked previews). */
  async removeGeminiKeyAt(userId: string, index: number) {
    const cur = (await this.getKeys(userId)).geminiKeys;
    if (index >= 0 && index < cur.length) cur.splice(index, 1);
    await this.setKeys(userId, { geminiKeys: cur });
  },
};

function safeDecrypt(payload: string): string | undefined {
  try {
    return decryptSecret(payload);
  } catch {
    return undefined;
  }
}

/** Decrypted Gemini blob is a JSON array; tolerate a legacy single-key string. */
function parseKeyList(dec?: string): string[] {
  if (!dec) return [];
  try {
    const v = JSON.parse(dec);
    if (Array.isArray(v)) return v.filter((x): x is string => typeof x === 'string' && x.length > 0);
  } catch {
    // legacy single key stored as plain string
  }
  return [dec];
}
