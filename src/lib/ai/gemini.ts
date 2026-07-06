import OpenAI from 'openai';
import type { AiClient, JsonRequest, VisionRequest, TextRequest, UsageSink } from './client';
import { MissingApiKeyError } from './client';
import { validateJson, sleep } from './json';

// Gemini exposes an OpenAI-compatible API, so we drive it with the OpenAI SDK.
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/';
const GEMINI_MODEL = 'gemini-2.0-flash'; // free tier, fast, multimodal, JSON-capable
const GEMINI_EMBED_MODEL = 'text-embedding-004';

export interface GeminiClientOptions {
  usage?: UsageSink;
  apiKey?: string;
}

/**
 * GeminiAiClient — a full AiClient backed by Google Gemini's free tier via its
 * OpenAI-compatible endpoint. Ignores the caller's ModelId (which names Claude/
 * GPT models) and routes every call to a Gemini model, so the whole app runs on
 * a single free key. Reasoning, vision and embeddings are all supported.
 */
export class GeminiAiClient implements AiClient {
  private apiKey?: string;
  private usage?: UsageSink;
  private _client?: OpenAI;

  constructor(opts: GeminiClientOptions = {}) {
    this.apiKey = opts.apiKey || process.env.GEMINI_API_KEY || undefined;
    this.usage = opts.usage;
  }

  private get client(): OpenAI {
    if (!this.apiKey) throw new MissingApiKeyError('gemini');
    return (this._client ??= new OpenAI({ apiKey: this.apiKey, baseURL: GEMINI_BASE_URL }));
  }

  private async record(engine: string | undefined, res: OpenAI.Chat.Completions.ChatCompletion) {
    await this.usage?.record({
      engine: engine ?? 'unknown',
      provider: 'google',
      model: GEMINI_MODEL,
      inputTok: res.usage?.prompt_tokens ?? 0,
      outputTok: res.usage?.completion_tokens ?? 0,
    });
  }

  async json<T>(req: JsonRequest<T>): Promise<T> {
    const system = `${req.system}\n\nRespond with ONLY a single valid JSON object. No markdown, no prose.`;
    let lastErr: unknown;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await this.client.chat.completions.create({
          model: GEMINI_MODEL,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: req.user },
          ],
        });
        await this.record(req.engine, res);
        return validateJson(req.schema, res.choices[0]?.message?.content ?? '');
      } catch (err) {
        lastErr = err;
        await sleep(300 * 2 ** attempt);
      }
    }
    throw new Error(`Gemini json() failed after retries: ${String(lastErr)}`);
  }

  async vision<T>(req: VisionRequest<T>): Promise<T> {
    const system = `${req.system}\n\nRespond with ONLY a single valid JSON object. No markdown, no prose.`;
    const res = await this.client.chat.completions.create({
      model: GEMINI_MODEL,
      response_format: { type: 'json_object' },
      messages: [
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
    });
    await this.record(req.engine ?? 'image-analysis', res);
    return validateJson(req.schema, res.choices[0]?.message?.content ?? '');
  }

  async text(req: TextRequest): Promise<string> {
    const res = await this.client.chat.completions.create({
      model: GEMINI_MODEL,
      messages: [
        { role: 'system', content: req.system },
        { role: 'user', content: req.user },
      ],
    });
    await this.record(req.engine, res);
    return res.choices[0]?.message?.content ?? '';
  }

  async embed(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];
    const res = await this.client.embeddings.create({ model: GEMINI_EMBED_MODEL, input: texts });
    return res.data.map((d) => d.embedding);
  }
}
