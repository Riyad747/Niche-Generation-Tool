import type { ZodType } from 'zod';

/**
 * Vendor-agnostic AI interface. Engines depend on THIS, never on the Anthropic
 * or OpenAI SDK directly — so tests inject a stub and model routing stays in one
 * place (model-policy.ts). See docs/01-ARCHITECTURE.md §4.1.
 */
export type ModelId =
  | 'claude-opus-4-8'
  | 'claude-sonnet-5'
  | 'claude-haiku-4-5-20251001'
  | 'gpt-cheap';

export interface JsonRequest<T> {
  system: string;
  user: string;
  schema: ZodType<T>;
  model?: ModelId;
  /** cost/usage attribution */
  engine?: string;
  maxTokens?: number;
}

export interface TextRequest {
  system: string;
  user: string;
  model?: ModelId;
  engine?: string;
  maxTokens?: number;
}

export interface ImageInput {
  /** base64-encoded image data (no data: prefix) */
  base64: string;
  mediaType: 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif';
}

export interface VisionRequest<T> extends JsonRequest<T> {
  image: ImageInput;
}

export interface AiClient {
  /** Structured output: model is forced to return JSON, validated against `schema`. */
  json<T>(req: JsonRequest<T>): Promise<T>;
  /** Structured output from an image + prompt (Claude vision). */
  vision<T>(req: VisionRequest<T>): Promise<T>;
  /** Freeform text. */
  text(req: TextRequest): Promise<string>;
  /** Batch embeddings (OpenAI text-embedding-3-large by default). */
  embed(texts: string[]): Promise<number[][]>;
}

export interface UsageSink {
  record(u: {
    engine: string;
    provider: string;
    model: string;
    inputTok: number;
    outputTok: number;
  }): void | Promise<void>;
}
