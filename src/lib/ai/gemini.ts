import OpenAI from 'openai';
import type { AiClient, JsonRequest, VisionRequest, TextRequest, UsageSink } from './client';
import { MissingApiKeyError, AiError } from './client';
import { validateJson, sleep } from './json';

// Gemini exposes an OpenAI-compatible API, so we drive it with the OpenAI SDK.
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/';
const GEMINI_MODEL = 'gemini-2.0-flash'; // free tier, fast, multimodal, JSON-capable
const GEMINI_EMBED_MODEL = 'text-embedding-004';

export interface GeminiClientOptions {
  usage?: UsageSink;
  /** One or more Gemini keys; rotated per call and failed over on rate limits. */
  apiKeys?: string[];
}

type ChatMessages = OpenAI.Chat.Completions.ChatCompletionMessageParam[];

/**
 * GeminiAiClient — a full AiClient backed by Google Gemini's free tier via its
 * OpenAI-compatible endpoint. Supports MULTIPLE keys: each call round-robins to
 * spread load, and on a 429 (rate limit) or 5xx it fails over to the next key
 * with backoff. This is what makes the free tier usable for a whole research run.
 */
export class GeminiAiClient implements AiClient {
  private keys: string[];
  private usage?: UsageSink;
  private clients = new Map<string, OpenAI>();
  private cursor = 0;

  constructor(opts: GeminiClientOptions = {}) {
    const fromEnv = process.env.GEMINI_API_KEY ? [process.env.GEMINI_API_KEY] : [];
    this.keys = (opts.apiKeys?.length ? opts.apiKeys : fromEnv).map((k) => k.trim()).filter(Boolean);
    this.usage = opts.usage;
  }

  private clientFor(key: string): OpenAI {
    let c = this.clients.get(key);
    if (!c) {
      c = new OpenAI({ apiKey: key, baseURL: GEMINI_BASE_URL });
      this.clients.set(key, c);
    }
    return c;
  }

  /** Run `fn` against keys in round-robin, failing over on 429/5xx with backoff. */
  private async withRotation<T>(fn: (client: OpenAI) => Promise<T>): Promise<T> {
    const n = this.keys.length;
    if (n === 0) throw new MissingApiKeyError('gemini');

    const attempts = Math.max(n * 3, 5);
    let lastErr: unknown;
    for (let i = 0; i < attempts; i++) {
      const key = this.keys[this.cursor++ % n];
      try {
        return await fn(this.clientFor(key));
      } catch (err) {
        lastErr = err;
        const status = (err as { status?: number })?.status ?? 0;
        const retryable = status === 429 || status === 408 || status >= 500;
        if (!retryable) {
          throw new AiError(`Gemini request failed (${status}): ${errMessage(err)}`, status);
        }
        // brief backoff before trying the next key (grows across full rounds)
        await sleep(Math.min(6000, 400 * 2 ** Math.floor(i / n)));
      }
    }
    const status = (lastErr as { status?: number })?.status;
    if (status === 429) {
      throw new AiError(
        'Gemini rate limit hit. Add another key in Settings → API keys (from a different Google project), or wait a minute and retry.',
        429,
      );
    }
    throw new AiError(`Gemini request failed: ${errMessage(lastErr)}`, status);
  }

  private async chat(messages: ChatMessages, json: boolean, engine?: string) {
    const res = await this.withRotation((client) =>
      client.chat.completions.create({
        model: GEMINI_MODEL,
        max_tokens: 8192, // avoid truncating large JSON (keyword/idea generation)
        ...(json ? { response_format: { type: 'json_object' as const } } : {}),
        messages,
      }),
    );
    await this.usage?.record({
      engine: engine ?? 'unknown',
      provider: 'google',
      model: GEMINI_MODEL,
      inputTok: res.usage?.prompt_tokens ?? 0,
      outputTok: res.usage?.completion_tokens ?? 0,
    });
    return res.choices[0]?.message?.content ?? '';
  }

  async json<T>(req: JsonRequest<T>): Promise<T> {
    const system = `${req.system}\n\nRespond with ONLY a single valid JSON object. No markdown, no prose.`;
    const messages: ChatMessages = [
      { role: 'system', content: system },
      { role: 'user', content: req.user },
    ];
    // Retry the whole call if the model returns malformed/truncated JSON.
    let lastErr: unknown;
    for (let attempt = 0; attempt < 3; attempt++) {
      const content = await this.chat(messages, true, req.engine);
      try {
        return validateJson(req.schema, content);
      } catch (err) {
        lastErr = err;
        await sleep(300 * (attempt + 1));
      }
    }
    throw new AiError(`Gemini returned invalid JSON: ${errMessage(lastErr)}`);
  }

  async vision<T>(req: VisionRequest<T>): Promise<T> {
    const system = `${req.system}\n\nRespond with ONLY a single valid JSON object. No markdown, no prose.`;
    const content = await this.chat(
      [
        { role: 'system', content: system },
        {
          role: 'user',
          content: [
            { type: 'text', text: req.user },
            {
              type: 'image_url',
              image_url: { url: `data:${req.image.mediaType};base64,${req.image.base64}` },
            },
          ],
        },
      ],
      true,
      req.engine ?? 'image-analysis',
    );
    return validateJson(req.schema, content);
  }

  async text(req: TextRequest): Promise<string> {
    return this.chat(
      [
        { role: 'system', content: req.system },
        { role: 'user', content: req.user },
      ],
      false,
      req.engine,
    );
  }

  async embed(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];
    const res = await this.withRotation((client) =>
      client.embeddings.create({ model: GEMINI_EMBED_MODEL, input: texts }),
    );
    return res.data.map((d) => d.embedding);
  }
}

function errMessage(err: unknown): string {
  if (err instanceof Error) return err.message.slice(0, 200);
  return String(err).slice(0, 200);
}
