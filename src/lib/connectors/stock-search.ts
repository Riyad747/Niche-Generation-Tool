import { cached, hashKey } from '@/lib/cache/redis';
import { CACHE_TTL } from '@/config/constants';
import type { StockConnector, SaturationSample } from './types';
import { estimatedResultCount } from './deterministic';

/**
 * Stock saturation connector. Public, reliable result-count APIs across Adobe/
 * Shutterstock/Freepik/Creative Market/Envato are limited and ToS-sensitive, so
 * this ships with a deterministic estimator by default. Swap in an official API
 * (e.g. Shutterstock API, Adobe Stock API with a partner key) behind this same
 * interface; the rest of the system is agnostic to the source.
 */
export class EstimatedStockConnector implements StockConnector {
  async resultCount(term: string): Promise<SaturationSample> {
    return cached(`saturation:est:${hashKey(term)}`, CACHE_TTL.saturation, async () => ({
      resultCount: estimatedResultCount(term),
      estimated: true,
    }));
  }
}
