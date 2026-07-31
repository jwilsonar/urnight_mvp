import { VersioningType, type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { type DbClient, role as roleTable } from '@urnight/db';
import { AppModule } from '../../../app.module';
import { DrizzleService } from '../../database/drizzle.service';
import { REDIS } from '../../redis/redis.module';
import type { RoleCode } from '../../../modules/identity/domain/entities/role.entity';
import { TokenService } from '../../../modules/identity/domain/ports/token.port';
import {
  STORAGE_PORT,
  type StoragePort,
} from '../../adapters/storage/storage.port';

/**
 * Levanta la app NestJS completa (AppModule) para e2e con el mismo pipeline del
 * arranque (prefijo /api, versioning URI v1, guards/filter globales). Sobrescribe
 * DrizzleService para que la app comparta la MISMA conexión a `urnight_test` que
 * el cliente de seed/truncate (DRIZZLE = factory de DrizzleService.db, así que un
 * solo override cubre repos y Unit of Work). Nunca toca `urnight_dev`.
 */
export async function createE2EApp(
  client: DbClient,
  overrides: { storage?: StoragePort } = {},
): Promise<INestApplication> {
  const drizzleStub = {
    db: client.db,
    sql: client.sql,
    onApplicationShutdown: async () => {},
  } as unknown as DrizzleService;

  let builder = Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(DrizzleService)
    .useValue(drizzleStub)
    // Redis falso in-memory: `incr→1` neutraliza el rate-limit (clave compartida
    // entre apps/tests → evita 429); `set NX`/`eval`/`get`/`del`/`keys` dan
    // semántica real al lock distribuido del checkout. Redis no es el contrato e2e.
    .overrideProvider(REDIS)
    .useValue(createFakeRedis());
  if (overrides.storage) {
    builder = builder.overrideProvider(STORAGE_PORT).useValue(overrides.storage);
  }
  const moduleRef = await builder.compile();

  const app = moduleRef.createNestApplication({ logger: false });
  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  await app.init();
  return app;
}

/**
 * Firma un access token válido (mismo secreto del JwtModule que verifica el
 * AuthGuard). Permite autenticar requests con roles/scope arbitrarios sin login.
 */
export async function signAccessToken(
  app: INestApplication,
  sub: string,
  roles: RoleCode[] = [],
  scope: { companyId?: string | null; localId?: string | null } = {},
): Promise<string> {
  const tokens = app.get(TokenService);
  const { token } = await tokens.signAccess({
    sub,
    email: `${sub}@e2e.test`,
    roles,
    companyId: scope.companyId ?? null,
    localId: scope.localId ?? null,
  });
  return token;
}

/**
 * Redis falso in-memory para e2e. Soporta lo que usan el rate-limiter (incr/expire)
 * y el lock distribuido del checkout (set NX/PX, eval para release, get/del/keys).
 * `incr` devuelve siempre 1 → el rate-limit nunca dispara (clave compartida).
 */
function createFakeRedis() {
  const store = new Map<string, string>();
  return {
    async incr(_key: string): Promise<number> {
      return 1;
    },
    async expire(_key: string, _seconds: number): Promise<number> {
      return 1;
    },
    async set(key: string, value: string, ...args: unknown[]): Promise<string | null> {
      const nx = args.some((a) => typeof a === 'string' && a.toUpperCase() === 'NX');
      if (nx && store.has(key)) return null;
      store.set(key, value);
      return 'OK';
    },
    async get(key: string): Promise<string | null> {
      return store.get(key) ?? null;
    },
    async del(...keys: string[]): Promise<number> {
      let n = 0;
      for (const k of keys) if (store.delete(k)) n += 1;
      return n;
    },
    // Lock release (redis.eval(script, 1, key, token)) → borra la clave.
    async eval(_script: string, _numKeys: number, key: string, ..._rest: unknown[]): Promise<number> {
      return store.delete(key) ? 1 : 0;
    },
    async keys(_pattern: string): Promise<string[]> {
      return [];
    },
  };
}

const ALL_ROLES: readonly RoleCode[] = [
  'user',
  'admin_local',
  'promoter',
  'validator',
  'super_admin',
];

/** Siembra el catálogo de roles RBAC (necesario para register y grant-role). */
export async function seedRoles(client: DbClient): Promise<void> {
  await client.db.insert(roleTable).values(
    ALL_ROLES.map((code) => ({ code, name: code, description: null, permissions: {} })),
  );
}
