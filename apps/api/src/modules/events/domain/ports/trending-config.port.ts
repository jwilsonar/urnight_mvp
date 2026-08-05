import type { TrendingConfig } from "../services/trending-score";

export interface TrendingConfigPort {
  current(): Promise<TrendingConfig>;
}

export const TRENDING_CONFIG = Symbol("TRENDING_CONFIG");
