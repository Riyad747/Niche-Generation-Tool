/**
 * Run an async mapper over items with a bounded concurrency. Preserves input
 * order in the result. Used to cap parallel AI scoring calls so we don't blow
 * provider rate limits during a large research run.
 */
export async function pMap<T, R>(
  items: readonly T[],
  mapper: (item: T, index: number) => Promise<R>,
  concurrency: number,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;

  async function worker() {
    while (cursor < items.length) {
      const i = cursor++;
      results[i] = await mapper(items[i], i);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, worker);
  await Promise.all(workers);
  return results;
}
