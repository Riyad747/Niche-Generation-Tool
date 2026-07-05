import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import type { ZodType } from 'zod';
import { env } from '@/lib/env';
import type {
  AiClient,
  JsonRequest,
  VisionRequest,
  TextRequest,
  ModelId,
  UsageSink,
} from './client';
import { MissingApiKeyError } from './client';

const OPENAI_EMBED_MODEL = 'text-embedding-3-large';
const OPENAI_CHEAP_MODEL = 'gpt-4o-mini';

export interface AiClientOptions {
  usage?: UsageSink;
  /** Per-user keys (BYOK). Fall back to server env keys when absent. */
  anthropicKey?: string;
  openaiKey?: string;
}

/**
 * Production AiClient: Claude for reasoning + structured output, OpenAI for
 * embeddings and the cheap `gpt-cheap` route. Resolves keys as user-key →
 * server-env; if neither exists the relevant call throws MissingApiKeyError so
 * the UI can prompt the user to add a key in Settings.
 */
export class RealAiClient implements AiClient {
  private anthropicKey?: string;
  private openaiKey?: string;
  private usage?: UsageSink;
  private _anthropic?: Anthropic;
  private _openai?: OpenAI;

  constructor(opts: AiClientOptions = {}) {
    this.usage = opts.usage;
    this.anthropicKey = opts.anthropicKey || env.ANTHROPIC_API_KEY || undefined;
    this.openaiKey = opts.openaiKey || env.OPENAI_API_KEY || undefined;
  }

  private get anthropic(): Anthropic {
    if (!this.anthropicKey) throw new MissingApiKeyError('anthropic');
    return (this._anthropic ??= new Anthropic({ apiKey: this.anthropicKey }));
  }

  private get openai(): OpenAI {
    if (!this.openaiKey) throw new MissingApiKeyError('openai');
    return (this._openai ??= new OpenAI({ apiKey: this.openaiKey }));
  }

  async json<T>(req: JsonRequest<T>): Promise<T> {
    const model = req.model ?? 'claude-sonnet-5';
    const maxTokens = req.maxTokens ?? 4096;
    const system = `${req.system}\n\nRespond with ONLY a single valid JSON object. No markdown, no prose.`;

    let lastErr: unknown;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        if (model === 'gpt-cheap') {
          const res = await this.openai.chat.completions.create({
            model: OPENAI_CHEAP_MODEL,
            response_format: { type: 'json_object' },
            messages: [
              { role: 'system', content: system },
              { role: 'user', content: req.user },
            ],
          });
          await this.usage?.record({
            engine: req.engine ?? 'unknown',
            provider: 'openai',
            model: OPENAI_CHEAP_MODEL,
            inputTok: res.usage?.prompt_tokens ?? 0,
            outputTok: res.usage?.completion_tokens ?? 0,
          });
          return validate(req.schema, res.choices[0]?.message?.content ?? '');
        }

        const res = await this.anthropic.messages.create({
          model,
          max_tokens: maxTokens,
          system,
          messages: [{ role: 'user', content: req.user }],
        });
        await this.usage?.record({
          engine: req.engine ?? 'unknown',
          provider: 'anthropic',
          model,
          inputTok: res.usage.input_tokens,
          outputTok: res.usage.output_tokens,
        });
        const text = res.content
          .filter((b): b is Anthropic.TextBlock => b.type === 'text')
          .map((b) => b.text)
          .join('');
        return validate(req.schema, text);
      } catch (err) {
        lastErr = err;
        await sleep(250 * 2 ** attempt);
      }
    }
    throw new Error(`AI json() failed after retries: ${String(lastErr)}`);
  }

  async vision<T>(req: VisionRequest<T>): Promise<T> {
    const model = req.model === 'gpt-cheap' || !req.model ? 'claude-opus-4-8' : req.model;
    const system = `${req.system}\n\nRespond with ONLY a single valid JSON object. No markdown, no prose.`;
    const res = await this.anthropic.messages.create({
      model,
      max_tokens: req.maxTokens ?? 4096,
      system,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: req.image.mediaType, data: req.image.base64 },
            },
            { type: 'text', text: req.user },
          ],
        },
      ],
    });
    await this.usage?.record({
      engine: req.engine ?? 'image-analysis',
      provider: 'anthropic',
      model,
      inputTok: res.usage.input_tokens,
      outputTok: res.usage.output_tokens,
    });
    const text = res.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('');
    return validate(req.schema, text);
  }

  async text(req: TextRequest): Promise<string> {
    const model: ModelId = req.model ?? 'claude-sonnet-5';
    const res = await this.anthropic.messages.create({
      model: model === 'gpt-cheap' ? 'claude-sonnet-5' : model,
      max_tokens: req.maxTokens ?? 2048,
      system: req.system,
      messages: [{ role: 'user', content: req.user }],
    });
    await this.usage?.record({
      engine: req.engine ?? 'unknown',
      provider: 'anthropic',
      model,
      inputTok: res.usage.input_tokens,
      outputTok: res.usage.output_tokens,
    });
    return res.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('');
  }

  async embed(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];
    const res = await this.openai.embeddings.create({
      model: OPENAI_EMBED_MODEL,
      input: texts,
      dimensions: 1536,
    });
    return res.data.map((d) => d.embedding);
  }
}

function validate<T>(schema: ZodType<T>, raw: string): T {
  const json = extractJson(raw);
  return schema.parse(json);
}

/** Tolerate stray markdown fences or leading prose around the JSON body. */
function extractJson(raw: string): unknown {
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

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
