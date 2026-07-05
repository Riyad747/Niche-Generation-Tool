/**
 * External-data connector contracts. Every connector is cached + rate-limited +
 * mockable, and MUST degrade gracefully: when a source is unavailable we return
 * a deterministic estimate flagged `estimated: true` rather than throwing, so a
 * research run never dies because Google Trends rate-limited us.
 *
 * Honesty note (docs/04-SCORING-ENGINES.md §Signal sourcing): exact platform
 * download/sales numbers are not publicly available. `estimated` propagates all
 * the way to the UI confidence indicator — never present an estimate as measured.
 */

export interface TrendSeries {
  /** normalized 0..100 points, oldest → newest */
  points: number[];
  estimated: boolean;
  source: 'GOOGLE_TRENDS' | 'PINTEREST' | 'REDDIT';
}

export interface SaturationSample {
  /** total result count across the queried platforms */
  resultCount: number;
  estimated: boolean;
}

export interface TrendConnector {
  series(term: string): Promise<TrendSeries>;
}

export interface StockConnector {
  /** approximate result count for a niche's canonical query on a platform */
  resultCount(term: string): Promise<SaturationSample>;
}
