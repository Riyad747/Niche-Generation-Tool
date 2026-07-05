import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import type { ZodType } from 'zod';
import { env } from '@/lib/env';
import type { AiClient, JsonRequest, VisionRequest, TextRequest, ModelId, UsageSink } from './client';

const OPENAI_EMBED_MODEL = 'text-embedding-3-large';
const OPENAI_CHEAP_MODEL = 'gpt-4o-mini';

/**
 * Production AiClient: Claude for reasoning + structured output, OpenAI for
 * embeddings and the cheap `gpt-cheap` route. JSON calls use retry + zod
 * validation so a malformed model response is retried, then surfaced clearly.
 */
export class RealAiClient implements AiClient {
  private anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  private openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

  constructor(private usage?: UsageSink) {}

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
