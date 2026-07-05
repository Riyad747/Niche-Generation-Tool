import type { ImageInput } from '@/lib/ai/client';

const SUPPORTED = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'] as const;

/** Parse a `data:<mime>;base64,<data>` URL into a vision ImageInput. Throws on bad input. */
export function parseImageDataUrl(dataUrl: string): ImageInput {
  const m = /^data:([^;]+);base64,(.+)$/s.exec(dataUrl);
  if (!m) throw new Error('Expected a base64 data URL');
  const mediaType = m[1];
  if (!SUPPORTED.includes(mediaType as (typeof SUPPORTED)[number])) {
    throw new Error(`Unsupported image type: ${mediaType}`);
  }
  return { base64: m[2], mediaType: mediaType as ImageInput['mediaType'] };
}

/** Rough byte size of a base64 payload, for upload-size limits. */
export function base64Bytes(base64: string): number {
  return Math.floor((base64.length * 3) / 4);
}
