'use client';

import { useState } from 'react';
import { useAnalyzeImage } from '@/hooks/use-image';
import { ScoreBadge } from '@/components/scores/score-badge';

/** Mode 3 — upload an image, get a full opportunity map. */
export function ImageAnalyzer() {
  const analyze = useAnalyzeImage();
  const [preview, setPreview] = useState<string | null>(null);

  function onFile(file: File | undefined) {
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    analyze.mutate(file);
  }

  const r = analyze.data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Image Analyzer</h1>
        <p className="text-sm text-muted-foreground">
          Upload a MidJourney/Flux render or stock image — get related niches, prompts, keywords and
          approval scores.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <div className="space-y-3">
          <label className="flex h-48 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed text-center text-sm text-muted-foreground hover:bg-muted/50">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="preview" className="max-h-44 rounded-lg object-contain" />
            ) : (
              <span>Click to upload<br />PNG / JPEG / WebP, ≤8MB</span>
            )}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => onFile(e.target.files?.[0])}
            />
          </label>
          {analyze.isPending && <p className="text-sm text-muted-foreground">Analyzing…</p>}
          {analyze.error && <p className="text-sm text-destructive">{analyze.error.message}</p>}
        </div>

        <div>
          {!r && !analyze.isPending && (
            <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
              Your opportunity map will appear here.
            </div>
          )}
          {r && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  ['Commercial', r.commercialIntent],
                  ['AI repro', r.aiReproducibility],
                  ['Vectorize', r.vectorSuitability],
                  ['Approval', r.approvalProbability],
                ].map(([label, val]) => (
                  <div key={label as string} className="rounded-xl border bg-card p-3 text-center">
                    <div className="text-xs text-muted-foreground">{label}</div>
                    <div className="mt-1"><ScoreBadge score={val as number} /></div>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border bg-card p-4 text-sm">
                <p><span className="text-muted-foreground">Style:</span> {r.visualStyle}</p>
                <p className="mt-1"><span className="text-muted-foreground">Composition:</span> {r.composition}</p>
                <p className="mt-1"><span className="text-muted-foreground">Category fit:</span> {r.categoryFit}</p>
                <div className="mt-2 flex gap-1">
                  {r.colorPalette.map((c, i) => (
                    <span key={i} className="h-5 w-5 rounded border" style={{ background: c }} title={c} />
                  ))}
                </div>
              </div>

              <Section title={`Related niches (${r.relatedNiches.length})`} items={r.relatedNiches} />
              <Section title={`Keywords (${r.keywords.length})`} items={r.keywords} />
              <Section title={`Titles (${r.titles.length})`} items={r.titles} list />
              <Section title={`Prompt variations (${r.promptVariations.length})`} items={r.promptVariations} list mono />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  items,
  list,
  mono,
}: {
  title: string;
  items: string[];
  list?: boolean;
  mono?: boolean;
}) {
  if (items.length === 0) return null;
  return (
    <section className="rounded-xl border bg-card p-4">
      <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</h3>
      {list ? (
        <ul className={`space-y-1 text-sm ${mono ? 'font-mono text-xs' : ''}`}>
          {items.slice(0, 40).map((it, i) => (
            <li key={i} className="text-muted-foreground">{it}</li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {items.slice(0, 60).map((it, i) => (
            <span key={i} className="rounded-md bg-muted px-2 py-0.5 text-xs">{it}</span>
          ))}
        </div>
      )}
    </section>
  );
}
