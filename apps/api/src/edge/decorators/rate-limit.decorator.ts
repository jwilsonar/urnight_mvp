import { SetMetadata } from '@nestjs/common';

export const RATE_LIMIT_KEY = 'rateLimit';

/**
 * Dimensión de bucketing del rate-limit, ADEMÁS de la IP.
 * - `ip`    → IP del cliente (siempre incluida por defecto).
 * - `email` → `req.body.email` (rutas de login/credenciales).
 * - `user`  → id del principal (JWT `sub`); útil en rutas autenticadas.
 */
export type RateLimitKeyBy = 'ip' | 'email' | 'user';

/** Bloqueo temporal por credenciales inválidas (solo login). */
export interface RateLimitLockout {
  /** Nº de 401 consecutivos que disparan el bloqueo. */
  maxFailures: number;
  /** Duración del bloqueo (segundos). */
  blockSec: number;
}

export interface RateLimitConfig {
  /** Máximo de peticiones por ventana. */
  limit: number;
  /** Ventana en segundos. */
  windowSec: number;
  /** Dimensiones del bucket. Cada dimensión aplica su propio contador. Default: `['ip']`. */
  keyBy?: RateLimitKeyBy[];
  /**
   * Si Redis no responde: `true` deniega (fail-closed, rutas sensibles),
   * `false` deja pasar (fail-open, rutas normales). Default: `false`.
   */
  failClosed?: boolean;
  /** Bloqueo por intentos fallidos de login (contador con TTL). */
  lockout?: RateLimitLockout;
}

/**
 * Configura rate-limit por ruta leído por `RateLimitGuard`. La metadata tiene
 * precedencia sobre el mapa de rutas sensibles del guard y sobre el default
 * global (§2.2, A3). Ej.: `@RateLimit({ limit: 5, windowSec: 60, keyBy: ['ip', 'email'] })`.
 */
export const RateLimit = (config: RateLimitConfig): MethodDecorator & ClassDecorator =>
  SetMetadata(RATE_LIMIT_KEY, config);
