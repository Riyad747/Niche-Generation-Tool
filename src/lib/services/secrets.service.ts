import { prisma } from '@/lib/db/client';
import { encryptSecret, decryptSecret, maskSecret } from '@/lib/utils/crypto';

export interface ProviderKeys {
  anthropicKey?: string;
  openaiKey?: string;
  geminiKey?: string;
}

export interface KeyStatus {
  anthropic: { set: boolean; masked: string | null };
  openai: { set: boolean; masked: string | null };
  gemini: { set: boolean; masked: string | null };
}

/**
 * SecretsService — stores/retrieves a user's own AI provider keys, encrypted at
 * rest. `getKeys` returns decrypted values for use by the AI client; `status`
 * returns only masked previews for the settings UI (never the raw key).
 */
export const secretsService = {
  async getKeys(userId: string): Promise<ProviderKeys> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { anthropicKeyEnc: true, openaiKeyEnc: true, geminiKeyEnc: true },
    });
    if (!user) return {};
    return {
      anthropicKey: user.anthropicKeyEnc ? safeDecrypt(user.anthropicKeyEnc) : undefined,
      openaiKey: user.openaiKeyEnc ? safeDecrypt(user.openaiKeyEnc) : undefined,
      geminiKey: user.geminiKeyEnc ? safeDecrypt(user.geminiKeyEnc) : undefined,
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
      gemini: keys.geminiKey
        ? { set: true, masked: maskSecret(keys.geminiKey) }
        : { set: false, masked: null },
    };
  },

  /**
   * Save keys. An empty string clears that provider's key; `undefined` leaves it
   * untouched so the UI can update one provider without resending the other.
   */
  async setKeys(userId: string, input: { anthropicKey?: string; openaiKey?: string; geminiKey?: string }) {
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
    if (input.geminiKey !== undefined) {
      data.geminiKeyEnc = input.geminiKey ? encryptSecret(input.geminiKey) : null;
    }
    await prisma.user.update({ where: { id: userId }, data });
  },
};

function safeDecrypt(payload: string): string | undefined {
  try {
    return decryptSecret(payload);
  } catch {
    // Encryption seed changed or corrupt payload — treat as unset rather than crash.
    return undefined;
  }
}
