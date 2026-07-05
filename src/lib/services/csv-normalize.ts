import { parseCsvRecords } from '@/lib/utils/csv';

export interface NormalizedAsset {
  title: string;
  keywords: string[];
  category: string | null;
  assetType: 'PNG' | 'VECTOR' | 'ILLUSTRATION' | 'PHOTO' | null;
}

/**
 * Normalize an Adobe Stock or Shutterstock contributor CSV export into a common
 * asset shape. Column names differ per platform, so we probe a set of likely
 * header aliases rather than hard-coding one schema.
 */
const TITLE_KEYS = ['title', 'description', 'caption'];
const KEYWORD_KEYS = ['keywords', 'keyword', 'tags'];
const CATEGORY_KEYS = ['category', 'categories'];

export function normalizePortfolioCsv(csv: string): NormalizedAsset[] {
  const records = parseCsvRecords(csv);
  return records
    .map((rec) => {
      const title = pick(rec, TITLE_KEYS) ?? '';
      const kwRaw = pick(rec, KEYWORD_KEYS) ?? '';
      const category = pick(rec, CATEGORY_KEYS);
      return {
        title,
        keywords: kwRaw
          .split(/[,;|]/)
          .map((k) => k.trim().toLowerCase())
          .filter(Boolean),
        category: category ? category.split(/[,;|]/)[0].trim() : null,
        assetType: inferAssetType(title, kwRaw),
      };
    })
    .filter((a) => a.title.length > 0 || a.keywords.length > 0);
}

function pick(rec: Record<string, string>, keys: string[]): string | null {
  for (const k of keys) if (rec[k]) return rec[k];
  return null;
}

function inferAssetType(title: string, keywords: string): NormalizedAsset['assetType'] {
  const t = `${title} ${keywords}`.toLowerCase();
  if (/\bvector\b|\bsvg\b|\beps\b/.test(t)) return 'VECTOR';
  if (/\billustration\b|\bicon\b|\bclipart\b/.test(t)) return 'ILLUSTRATION';
  if (/\bphoto\b|\bphotograph\b/.test(t)) return 'PHOTO';
  return null;
}
