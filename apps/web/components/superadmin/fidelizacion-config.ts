import { BADGES_DEMO, NIVELES_CONFIG_DEMO, PUNTOS_REGLAS_DEMO } from '@/lib/mock/fidelizacion';

export interface LoyaltyBadgeConfig {
  id: string;
  name: string;
  icon: string;
  criterion: string;
}

export interface LoyaltyPointRule {
  id: string;
  action: string;
  points: number;
}

export interface LoyaltyLevelRule {
  id: string;
  name: string;
  threshold: number;
  multiplier: number;
}

export const INITIAL_BADGES: LoyaltyBadgeConfig[] = BADGES_DEMO.map((badge, index) => ({
  id: `badge-${index + 1}`,
  name: badge.nombre,
  icon: badge.icono,
  criterion: badge.sub,
}));

export const INITIAL_POINT_RULES: LoyaltyPointRule[] = PUNTOS_REGLAS_DEMO.map((rule, index) => ({
  id: `point-rule-${index + 1}`,
  action: rule.accion,
  points: Number(rule.puntos.match(/\d+/)?.[0] ?? 0),
}));

const LEVEL_MULTIPLIERS = [1, 1.1, 1.25, 1.5] as const;

export const INITIAL_LEVEL_RULES: LoyaltyLevelRule[] = NIVELES_CONFIG_DEMO.map((level, index) => ({
  id: `level-${index + 1}`,
  name: level.nombre,
  threshold: level.umbralPuntos,
  multiplier: LEVEL_MULTIPLIERS[index] ?? 1,
}));
