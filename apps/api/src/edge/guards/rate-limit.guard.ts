import type { CanActivate, ExecutionContext } from '@nestjs/common';
import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Redis } from 'ioredis';
import type { Request, Response } from 'express';
import { REDIS } from '../../shared/redis/redis.module';
import { createLogger } from '../../shared/logging/logger';
import { MfaLockedError } from '../../modules/identity/domain/errors/identity.errors';
import {
  RATE_LIMIT_KEY,
  type RateLimitConfig,
  type RateLimitKeyBy,
} from '../decorators/rate-limit.decorator';

/** Default global (§2.2): 100 req/min por IP, fail-open (una caché caída no tumba la API). */
const GLOBAL_DEFAULT: RateLimitConfig = {
  limit: 100,
  windowSec: 60,
  keyBy: ['ip'],
  failClosed: false,
};

interface SensitiveRoute extends RateLimitConfig {
  method: string;
  /** Sufijo de la ruta (independiente del prefijo `/api` y del versionado). */
  suffix: string;
}

/**
 * Límites dedicados y estrictos por ruta sensible (A3). Se aplican por match de
 * método+sufijo, sin depender de que los controllers (en `modules/`, otros
 * dueños) declaren `@RateLimit`. `failClosed: true` → si Redis cae, se DENIEGA.
 */
const SENSITIVE_ROUTES: readonly SensitiveRoute[] = [
  {
    method: 'POST',
    suffix: '/auth/login',
    limit: 10,
    windowSec: 60,
    keyBy: ['ip', 'email'],
    failClosed: true,
    lockout: { maxFailures: 5, blockSec: 900 }, // 5 fallos consecutivos → bloqueo 15 min
  },
  { method: 'POST', suffix: '/auth/refresh', limit: 20, windowSec: 60, keyBy: ['ip'], failClosed: true },
  { method: 'POST', suffix: '/auth/google', limit: 10, windowSec: 60, keyBy: ['ip'], failClosed: true },
  {
    method: 'POST',
    suffix: '/orders/checkout',
    limit: 10,
    windowSec: 60,
    keyBy: ['ip', 'user'],
    failClosed: true,
  },
];

/**
 * Rate Limiter (§2.2, A3). Ventana fija en Redis con límites dedicados por ruta.
 *
 * - Login/refresh/google/checkout tienen cupos estrictos (≪ 100/min global),
 *   con bucket compuesto por IP + email/usuario para no colapsar tras proxy.
 * - Login: bloqueo temporal por 401 consecutivos (lockout con TTL).
 * - Redis caído: FAIL-CLOSED en rutas sensibles (deniega), FAIL-OPEN en el resto
 *   (decisión documentada: no tumbar toda la API por una caché de rate-limit).
 * - Precedencia de config: `@RateLimit` (metadata) > mapa de rutas sensibles > default global.
 */
@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly log = createLogger(RateLimitGuard.name);

  constructor(
    @Inject(REDIS) private readonly redis: Redis,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request & { user?: { id?: string } }>();
    const res = context.switchToHttp().getResponse<Response>();

    const { cfg, routeId } = this.resolveConfig(context, req);

    try {
      // Lockout por credenciales inválidas (login): pre-check antes de contar.
      if (cfg.lockout) {
        await this.enforceLockout(req, res, cfg);
      }

      const dims = cfg.keyBy ?? ['ip'];
      for (const dim of dims) {
        const principal = this.principalOf(req, dim);
        if (principal === null) continue; // sin principal derivable → se omite la dimensión
        await this.hit(res, cfg, `ratelimit:${routeId}:${dim}:${principal}`, dim);
      }
    } catch (err) {
      if (err instanceof HttpException || err instanceof MfaLockedError) throw err; // errores legítimos
      // Redis inaccesible: fail-closed en rutas sensibles, fail-open en el resto.
      if (cfg.failClosed) {
        this.log.error({ err: (err as Error).message, path: req.url }, 'ratelimit.fail_closed');
        throw new ServiceUnavailableException('Servicio temporalmente no disponible');
      }
      this.log.warn({ err: (err as Error).message, path: req.url }, 'ratelimit.fail_open');
    }

    return true;
  }

  /** Incrementa el contador de una dimensión y lanza 429 si supera el límite. */
  private async hit(res: Response, cfg: RateLimitConfig, key: string, dim: RateLimitKeyBy): Promise<void> {
    const count = await this.redis.incr(key);
    if (count === 1) await this.redis.expire(key, cfg.windowSec);
    if (count > cfg.limit) {
      this.log.warn({ key, count, limit: cfg.limit, dim }, 'ratelimit.exceeded');
      res.setHeader('Retry-After', String(cfg.windowSec));
      if (dim === 'challenge') throw new MfaLockedError();
      throw new HttpException('Demasiadas peticiones', HttpStatus.TOO_MANY_REQUESTS);
    }
  }

  /**
   * Bloqueo temporal por login fallido. Pre-check del contador de 401 por email;
   * y registra el resultado real de la request vía listener `finish` (incrementa
   * en 401, resetea en éxito) — todo dentro de la capa edge, sin tocar el use-case.
   */
  private async enforceLockout(
    req: Request,
    res: Response,
    cfg: RateLimitConfig,
  ): Promise<void> {
    const email = this.principalOf(req, 'email');
    if (!email || !cfg.lockout) return;
    const failKey = `ratelimit:login-fail:${email}`;
    const { maxFailures, blockSec } = cfg.lockout;

    const fails = Number((await this.redis.get(failKey)) ?? 0);
    if (fails >= maxFailures) {
      this.log.warn({ email, fails }, 'ratelimit.login.locked');
      res.setHeader('Retry-After', String(blockSec));
      throw new HttpException(
        'Cuenta bloqueada temporalmente por intentos fallidos',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    res.on('finish', () => {
      const status = res.statusCode;
      if (status === HttpStatus.UNAUTHORIZED) {
        void this.redis
          .incr(failKey)
          .then((n) => (n === 1 ? this.redis.expire(failKey, blockSec) : undefined))
          .catch((e) => this.log.warn({ err: (e as Error).message }, 'ratelimit.login.count_failed'));
      } else if (status < 400) {
        void this.redis
          .del(failKey)
          .catch((e) => this.log.warn({ err: (e as Error).message }, 'ratelimit.login.reset_failed'));
      }
    });
  }

  /** Resuelve la config efectiva: metadata @RateLimit > ruta sensible > default global. */
  private resolveConfig(
    context: ExecutionContext,
    req: Request,
  ): { cfg: RateLimitConfig; routeId: string } {
    const meta = this.reflector.getAllAndOverride<RateLimitConfig | undefined>(RATE_LIMIT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (meta) {
      return { cfg: meta, routeId: `h:${context.getClass().name}.${context.getHandler().name}` };
    }

    const path = this.pathOf(req);
    const method = (req.method ?? 'GET').toUpperCase();
    const route = SENSITIVE_ROUTES.find((r) => r.method === method && path.endsWith(r.suffix));
    if (route) return { cfg: route, routeId: `${route.method}:${route.suffix}` };

    return { cfg: GLOBAL_DEFAULT, routeId: 'global' };
  }

  /** Principal de una dimensión de bucketing; `null` si no es derivable. */
  private principalOf(
    req: Request & { user?: { id?: string } },
    dim: RateLimitKeyBy,
  ): string | null {
    if (dim === 'ip') return req.ip ?? 'unknown';
    if (dim === 'email') {
      const email = (req.body as { email?: unknown } | undefined)?.email;
      return typeof email === 'string' && email.length > 0 ? email.toLowerCase() : null;
    }
    if (dim === 'challenge') {
      const challengeId = (req.body as { challengeId?: unknown } | undefined)?.challengeId;
      return typeof challengeId === 'string' && challengeId.length > 0 ? challengeId : null;
    }
    // dim === 'user': req.user aún no existe (RateLimit corre ANTES de Auth);
    // se deriva el `sub` del bearer SIN verificar — solo para bucketing, no authz.
    return req.user?.id ?? this.subFromBearer(req);
  }

  /** Extrae el `sub` del JWT del header Authorization sin verificar la firma. */
  private subFromBearer(req: Request): string | null {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) return null;
    const parts = header.slice(7).split('.');
    const payloadB64 = parts.length === 3 ? parts[1] : undefined;
    if (!payloadB64) return null;
    try {
      const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8')) as {
        sub?: unknown;
      };
      return typeof payload.sub === 'string' ? payload.sub : null;
    } catch {
      return null;
    }
  }

  private pathOf(req: Request): string {
    const url = req.originalUrl ?? req.url ?? '';
    const q = url.indexOf('?');
    return q === -1 ? url : url.slice(0, q);
  }
}
