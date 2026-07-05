import type { TrendConnector, StockConnector } from './types';
import { RedditTrendConnector } from './trends';
import { EstimatedStockConnector } from './stock-search';

export * from './types';

/**
 * Connector factory. Central place to swap real vs estimated implementations
 * (e.g. gate a real Shutterstock connector behind an env flag). Today: Reddit
 * momentum (real, with fallback) + estimated stock saturation.
 */
export function getTrendConnector(): TrendConnector {
  return new RedditTrendConnector();
}

export function getStockConnector(): StockConnector {
  return new EstimatedStockConnector();
}
