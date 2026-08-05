const DAY_MS = 86_400_000;
const PROXIMITY_HALF_LIFE_DAYS = 30;

export interface TrendingConfig {
  weightVelocity: number;
  weightProximity: number;
  weightIntensity: number;
  velocityWindowDays: number;
}

export const DEFAULT_TRENDING_CONFIG: Readonly<TrendingConfig> = Object.freeze({
  weightVelocity: 0.5,
  weightProximity: 0.3,
  weightIntensity: 0.2,
  velocityWindowDays: 7,
});

export interface TrendingSignals {
  recentSales: number;
  maxRecentSales: number;
  startsAt: Date;
  ticketsSold: number;
  capacity: number;
}

export interface ScoredTrendingCandidate {
  id: string;
  startsAt: Date;
  score: number;
}

export function calculateTrendingScore(
  signals: TrendingSignals,
  config: TrendingConfig,
  now: Date,
): number {
  const recentSales = Math.max(0, signals.recentSales);
  const maxRecentSales = Math.max(0, signals.maxRecentSales);

  // El logaritmo conserva la ventaja de vender rapido esta semana, pero reduce
  // la ventaja puramente estructural de un local con mucho mas aforo.
  const velocity =
    maxRecentSales === 0
      ? 0
      : Math.log1p(recentSales) / Math.log1p(maxRecentSales);

  const daysUntilStart = Math.max(
    0,
    (signals.startsAt.getTime() - now.getTime()) / DAY_MS,
  );
  // Esta curva vale 1 para lo inmediato y 0.5 a 30 dias: acerca al home lo que
  // la gente puede decidir ahora sin ocultar de golpe los eventos lejanos.
  const proximity = 1 / (1 + daysUntilStart / PROXIMITY_HALF_LIFE_DAYS);

  // La proporcion vendida permite comparar demanda relativa: llenar un aforo
  // pequeno debe competir con vender mas entradas en un recinto grande.
  const intensity =
    signals.capacity <= 0
      ? 0
      : Math.min(1, Math.max(0, signals.ticketsSold / signals.capacity));

  const totalWeight =
    config.weightVelocity + config.weightProximity + config.weightIntensity;
  if (totalWeight <= 0) return 0;

  return (
    (velocity * config.weightVelocity +
      proximity * config.weightProximity +
      intensity * config.weightIntensity) /
    totalWeight
  );
}

export function compareTrendingCandidates(
  a: ScoredTrendingCandidate,
  b: ScoredTrendingCandidate,
): number {
  const byScore = b.score - a.score;
  if (byScore !== 0) return byScore;
  const byStart = a.startsAt.getTime() - b.startsAt.getTime();
  return byStart !== 0 ? byStart : a.id.localeCompare(b.id);
}
