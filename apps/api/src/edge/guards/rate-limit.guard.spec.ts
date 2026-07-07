import type { ExecutionContext } from '@nestjs/common';
import { HttpException, ServiceUnavailableException } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import type { Redis } from 'ioredis';
import { describe, expect, it } from 'vitest';
import type { RateLimitConfig } from '../decorators/rate-limit.decorator';
import { RateLimitGuard } from './rate-limit.guard';

/** Redis in-memory con conteo real (incr/expire/get/del). */
function fakeRedis(overrides: Partial<Redis> = {}): Redis {
  const store = new Map<string, number>();
  return {
    incr: async (k: string) => {
      const n = (store.get(k) ?? 0) + 1;
      store.set(k, n);
      return n;
    },
    expire: async () => 1,
    get: async (k: string) => (store.has(k) ? String(store.get(k)) : null),
    del: async (k: string) => (store.delete(k) ? 1 : 0),
    ...overrides,
  } as unknown as Redis;
}

interface FakeRes {
  statusCode: number;
  setHeader: (k: string, v: string) => void;
  on: (event: string, cb: () => void) => FakeRes;
  emit: (event: string) => void;
}

function fakeRes(): FakeRes {
  const listeners: Record<string, Array<() => void>> = {};
  const res: FakeRes = {
    statusCode: 200,
    setHeader: () => {},
    on(event, cb) {
      (listeners[event] ??= []).push(cb);
      return res;
    },
    emit(event) {
      (listeners[event] ?? []).forEach((cb) => cb());
    },
  };
  return res;
}

function makeReq(opts: Partial<{ method: string; url: string; ip: string; body: unknown; headers: Record<string, string> }> = {}) {
  const url = opts.url ?? '/api/v1/auth/login';
  return {
    method: opts.method ?? 'POST',
    url,
    originalUrl: url,
    ip: opts.ip ?? '1.2.3.4',
    body: opts.body ?? {},
    headers: opts.headers ?? {},
  };
}

function makeContext(req: unknown, res: unknown, meta?: RateLimitConfig): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => req, getResponse: () => res }),
    getHandler: () => function handler() {},
    getClass: () => class TestController {},
  } as unknown as ExecutionContext;
}

const reflectorWith = (meta?: RateLimitConfig): Reflector =>
  ({ getAllAndOverride: () => meta }) as unknown as Reflector;

describe('RateLimitGuard', () => {
  it('aplica el límite estricto dedicado de POST /auth/login (10/min)', async () => {
    const guard = new RateLimitGuard(fakeRedis(), reflectorWith());
    const req = makeReq({ body: { email: 'a@b.com' } });

    for (let i = 0; i < 10; i += 1) {
      await expect(guard.canActivate(makeContext(req, fakeRes()))).resolves.toBe(true);
    }
    await expect(guard.canActivate(makeContext(req, fakeRes()))).rejects.toBeInstanceOf(HttpException);
  });

  it('usa el default global (100/min) en rutas normales', async () => {
    const guard = new RateLimitGuard(fakeRedis(), reflectorWith());
    const req = makeReq({ method: 'GET', url: '/api/v1/events' });

    for (let i = 0; i < 100; i += 1) {
      await expect(guard.canActivate(makeContext(req, fakeRes()))).resolves.toBe(true);
    }
    await expect(guard.canActivate(makeContext(req, fakeRes()))).rejects.toBeInstanceOf(HttpException);
  });

  it('honra @RateLimit por metadata (precede al mapa y al default)', async () => {
    const meta: RateLimitConfig = { limit: 2, windowSec: 60, keyBy: ['ip'] };
    const guard = new RateLimitGuard(fakeRedis(), reflectorWith(meta));
    const req = makeReq({ method: 'GET', url: '/api/v1/anything' });

    await expect(guard.canActivate(makeContext(req, fakeRes(), meta))).resolves.toBe(true);
    await expect(guard.canActivate(makeContext(req, fakeRes(), meta))).resolves.toBe(true);
    await expect(guard.canActivate(makeContext(req, fakeRes(), meta))).rejects.toBeInstanceOf(HttpException);
  });

  it('FAIL-CLOSED en ruta sensible cuando Redis cae (deniega 503)', async () => {
    const brokenRedis = fakeRedis({
      incr: (async () => {
        throw new Error('ECONNREFUSED');
      }) as unknown as Redis['incr'],
      get: (async () => null) as unknown as Redis['get'],
    });
    const guard = new RateLimitGuard(brokenRedis, reflectorWith());
    const req = makeReq({ body: { email: 'a@b.com' } });

    await expect(guard.canActivate(makeContext(req, fakeRes()))).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('FAIL-OPEN en ruta normal cuando Redis cae (deja pasar)', async () => {
    const brokenRedis = fakeRedis({
      incr: (async () => {
        throw new Error('ECONNREFUSED');
      }) as unknown as Redis['incr'],
    });
    const guard = new RateLimitGuard(brokenRedis, reflectorWith());
    const req = makeReq({ method: 'GET', url: '/api/v1/events' });

    await expect(guard.canActivate(makeContext(req, fakeRes()))).resolves.toBe(true);
  });

  it('bloquea el login tras N intentos fallidos (lockout por 401)', async () => {
    const guard = new RateLimitGuard(fakeRedis(), reflectorWith());
    const req = makeReq({ body: { email: 'victim@b.com' } });

    // 5 intentos que terminan en 401 → se registran como fallos vía finish.
    for (let i = 0; i < 5; i += 1) {
      const res = fakeRes();
      await expect(guard.canActivate(makeContext(req, res))).resolves.toBe(true);
      res.statusCode = 401;
      res.emit('finish');
    }

    // 6º intento: la cuenta está bloqueada temporalmente (429) antes de tocar credenciales.
    await expect(guard.canActivate(makeContext(req, fakeRes()))).rejects.toBeInstanceOf(HttpException);
  });

  it('un login exitoso resetea el contador de fallos', async () => {
    const guard = new RateLimitGuard(fakeRedis(), reflectorWith());
    const req = makeReq({ body: { email: 'user@b.com' } });

    // 4 fallos
    for (let i = 0; i < 4; i += 1) {
      const res = fakeRes();
      await guard.canActivate(makeContext(req, res));
      res.statusCode = 401;
      res.emit('finish');
    }
    // 1 éxito → reset
    const okRes = fakeRes();
    await guard.canActivate(makeContext(req, okRes));
    okRes.statusCode = 200;
    okRes.emit('finish');

    // No debe estar bloqueado (el contador de fallos volvió a 0).
    await expect(guard.canActivate(makeContext(req, fakeRes()))).resolves.toBe(true);
  });
});
