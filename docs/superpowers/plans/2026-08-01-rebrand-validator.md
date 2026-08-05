# Rebrand y sesión renovable de `apps/validator` — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Llevar la app de puerta al Design System RAVENUE tomando `apps/mobile` como referencia, y darle sesión renovable para que un 401 a mitad de turno deje de expulsar al validador.

**Architecture:** Hexagonal no aplica aquí — es una app Expo Router. El eje del plan es separar **lógica pura** (probable en Vitest, entorno `node`, sin Expo) de **adaptadores de plataforma** (SecureStore, SQLite, fetch, cámara). Primero el tramo de sesión completo, después la piel, porque el contrato de `useAuth()` cambia y las pantallas deben escribirse una sola vez contra el contrato final.

**Tech Stack:** Expo SDK 54, React Native 0.81.5, expo-router 6, expo-secure-store, expo-sqlite, expo-camera, expo-haptics, `@react-native-community/netinfo`, `@urnight/contracts` (Zod), Vitest 2.

**Spec:** `docs/superpowers/specs/2026-08-01-rebrand-validator-design.md`

## Global Constraints

- Todo el código y los comentarios van **en español**, como el resto del repositorio.
- **Nunca** loguear el contenido del QR ni números de documento (§6 de PROJECT_SPECS). Solo metadatos. `lib/logger.ts` ya redacta `qrCode`, `accessToken`, `refreshToken`, `documentNumber`.
- **No se toca `apps/mobile`.** Ni un fichero.
- `ACCESS_KEY` conserva su valor actual `'urnight_validator_access_token'`. El fichero SQLite conserva su nombre `'urnight-validator.db'`.
- La lógica que importa algo de Expo o de React Native **no se prueba**; vive en un fichero aparte del que se prueba. Es la regla que ya sigue `apps/mobile/vitest.config.ts`.
- Tokens del DS: se copian literalmente de `apps/mobile/lib/theme.ts`. Nada de colores crudos en las pantallas.
- Constantes con nombre: `VERDICT_AUTOCLOSE_MS = 1500`, `RESCAN_WINDOW_MS = 5000`, margen de frescura de token `skewSeconds = 30`.
- Cada tarea cierra con `pnpm --filter @urnight/validator typecheck`, `lint` y `test` en verde antes del commit.

---

## Estructura de ficheros

| Fichero | Responsabilidad | Tarea |
|---|---|---|
| `apps/validator/vitest.config.ts` | **Nuevo.** Config Vitest, entorno `node`, `lib/**/*.spec.ts` | 1 |
| `apps/validator/lib/session-rules.ts` | **Nuevo.** Claims, frescura, rol y decisión de sesión. Puro | 1 |
| `apps/validator/lib/session-rules.spec.ts` | **Nuevo.** Tests de lo anterior | 1 |
| `apps/validator/lib/api-client.ts` | `ApiError` con `code`; `refreshRequest`, `logoutRequest` | 2 |
| `apps/validator/lib/auth.ts` | Solo plataforma: par de tokens en SecureStore | 3 |
| `apps/validator/lib/auth-context.tsx` | Single-flight, `AppState`, política offline | 3 |
| `apps/validator/app/_layout.tsx` | Gate por `status`; luego tematizado | 3, 5 |
| `apps/validator/app/scan.tsx` | Rama de sesión; luego overlay de veredicto | 3, 8 |
| `apps/validator/lib/theme.ts` | **Nuevo.** Tokens RAVENUE. Puro | 4 |
| `apps/validator/components/ui.tsx` | **Nuevo.** `Eyebrow`, `Chip`, `Button`, `Field`, `LoadingState` | 4 |
| `apps/validator/lib/net.ts` | **Nuevo.** `useIsOnline` | 4 |
| `apps/validator/app/login.tsx` | Login con DS | 5 |
| `apps/validator/app/index.tsx` | Panel de turno | 6 |
| `apps/validator/lib/scan-rules.ts` | **Nuevo.** Dedupe y presentación del veredicto. Puro | 7 |
| `apps/validator/lib/scan-rules.spec.ts` | **Nuevo.** Tests de lo anterior | 7 |
| `docs/diagramas-secuencia/05-entradas-validacion.md` | SD-10, SD-11 y trazabilidad | 9 |
| `docs/diagramas-secuencia/90-canales-moviles.md` | §2.3, §9-4, §9-5 | 9 |

**Refinamiento sobre el spec:** al escribir la Tarea 3 aparece que `getAccessToken()` no basta para el reintento tras un 401. Si el servidor rechaza un access que todavía no expiró (revocado), `getAccessToken()` lo devolvería igual y el reintento repetiría el mismo 401. El contrato suma por eso `refreshAccessToken(): Promise<string | null>`, que fuerza la renovación. Es la única desviación respecto de §2.1 del spec.

---

### Task 1: Vitest y reglas puras de sesión

**Files:**
- Create: `apps/validator/vitest.config.ts`
- Create: `apps/validator/lib/session-rules.ts`
- Test: `apps/validator/lib/session-rules.spec.ts`
- Modify: `apps/validator/package.json`

**Interfaces:**
- Consumes: nada.
- Produces:
  - `interface AccessClaims { sub?: string; email?: string; roles?: string[]; exp?: number }`
  - `claimsOf(token: string | null | undefined): AccessClaims | null`
  - `isTokenFresh(token: string | null | undefined, skewSeconds?: number): boolean`
  - `hasValidatorRole(claims: AccessClaims | null): boolean`
  - `sessionActionFor(pair: { accessToken: string | null; refreshToken: string | null }): 'use' | 'refresh' | 'dead'`
  - `refreshFailureAction(status: number | null): 'offline' | 'dead'`

- [ ] **Step 1: Añadir Vitest al paquete**

En `apps/validator/package.json`, dentro de `scripts` (junto a `lint`):

```json
    "test": "vitest run",
    "test:watch": "vitest",
```

Y en `devDependencies`, la misma versión que usa `apps/mobile`:

```json
    "vitest": "^2.1.8"
```

Luego instalar:

```bash
pnpm install
```

- [ ] **Step 2: Crear la configuración de Vitest**

Crear `apps/validator/vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

/**
 * Pruebas de los módulos PUROS del validador. Entorno `node`: aquí no se monta
 * React Native ni se carga ningún módulo de Expo. Cualquier lógica que necesite
 * plataforma vive en un fichero aparte del que se prueba (ver `lib/auth.ts`
 * frente a `lib/session-rules.ts`).
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['lib/**/*.spec.ts'],
  },
});
```

- [ ] **Step 3: Escribir los tests que fallan**

Crear `apps/validator/lib/session-rules.spec.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  claimsOf,
  hasValidatorRole,
  isTokenFresh,
  refreshFailureAction,
  sessionActionFor,
  type AccessClaims,
} from './session-rules';

/** Arma un JWT de mentira: solo el payload importa, la firma no se verifica aquí. */
function tokenWith(claims: AccessClaims): string {
  const payload = Buffer.from(JSON.stringify(claims)).toString('base64url');
  return `cabecera.${payload}.firma`;
}

const ahora = Math.floor(Date.now() / 1000);
const vigente = tokenWith({ sub: 'u1', roles: ['validator'], exp: ahora + 3600 });
const vencido = tokenWith({ sub: 'u1', roles: ['validator'], exp: ahora - 10 });
const sinRol = tokenWith({ sub: 'u1', roles: ['attendee'], exp: ahora + 3600 });

describe('claimsOf', () => {
  it('decodifica el payload base64url del token', () => {
    expect(claimsOf(vigente)).toMatchObject({ sub: 'u1', roles: ['validator'] });
  });

  it('devuelve null si el token no tiene tres segmentos', () => {
    expect(claimsOf('no-es-un-jwt')).toBeNull();
  });

  it('devuelve null si no hay token', () => {
    expect(claimsOf(null)).toBeNull();
    expect(claimsOf(undefined)).toBeNull();
  });

  it('lee los claims aunque el token haya expirado', () => {
    expect(claimsOf(vencido)?.roles).toEqual(['validator']);
  });
});

describe('isTokenFresh', () => {
  it('acepta un token con expiración lejana', () => {
    expect(isTokenFresh(vigente)).toBe(true);
  });

  it('rechaza un token expirado', () => {
    expect(isTokenFresh(vencido)).toBe(false);
  });

  it('rechaza un token que expira dentro del margen de 30 s', () => {
    const alFilo = tokenWith({ roles: ['validator'], exp: ahora + 20 });
    expect(isTokenFresh(alFilo)).toBe(false);
    expect(isTokenFresh(alFilo, 0)).toBe(true);
  });

  it('rechaza un token sin exp', () => {
    expect(isTokenFresh(tokenWith({ roles: ['validator'] }))).toBe(false);
  });
});

describe('hasValidatorRole', () => {
  it('acepta claims con rol validator', () => {
    expect(hasValidatorRole(claimsOf(vigente))).toBe(true);
  });

  it('rechaza claims sin rol validator', () => {
    expect(hasValidatorRole(claimsOf(sinRol))).toBe(false);
  });

  it('rechaza claims nulos', () => {
    expect(hasValidatorRole(null)).toBe(false);
  });
});

describe('sessionActionFor', () => {
  it('usa el access cuando está fresco y porta el rol', () => {
    expect(sessionActionFor({ accessToken: vigente, refreshToken: vigente })).toBe('use');
  });

  it('renueva cuando el access venció pero el refresh sigue vigente', () => {
    expect(sessionActionFor({ accessToken: vencido, refreshToken: vigente })).toBe('refresh');
  });

  it('da la sesión por muerta si el refresh venció', () => {
    expect(sessionActionFor({ accessToken: vencido, refreshToken: vencido })).toBe('dead');
  });

  it('da la sesión por muerta si no hay refresh guardado', () => {
    expect(sessionActionFor({ accessToken: vigente, refreshToken: null })).toBe('dead');
  });

  it('da la sesión por muerta si el access no porta rol validator', () => {
    expect(sessionActionFor({ accessToken: sinRol, refreshToken: vigente })).toBe('dead');
  });
});

describe('refreshFailureAction', () => {
  it('sigue offline cuando la renovación falló por red', () => {
    expect(refreshFailureAction(null)).toBe('offline');
  });

  it('mata la sesión ante 401', () => {
    expect(refreshFailureAction(401)).toBe('dead');
  });

  it('mata la sesión ante 400', () => {
    expect(refreshFailureAction(400)).toBe('dead');
  });

  it('sigue offline ante un 5xx, que es transitorio', () => {
    expect(refreshFailureAction(503)).toBe('offline');
  });
});
```

- [ ] **Step 4: Correr los tests para verificar que fallan**

```bash
pnpm --filter @urnight/validator test
```

Esperado: FAIL — `Failed to resolve import "./session-rules"`.

- [ ] **Step 5: Implementar el módulo puro**

Crear `apps/validator/lib/session-rules.ts`:

```ts
/**
 * Reglas puras de sesión del validador (§2 del diseño). Sin imports de Expo ni
 * de React Native a propósito: es lo que permite probarlas en Vitest sin montar
 * la plataforma. Lo que toca almacenamiento seguro vive en `lib/auth.ts`.
 */

export interface AccessClaims {
  sub?: string;
  email?: string;
  roles?: string[];
  exp?: number;
}

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/** Decodifica base64url → JSON sin depender de atob/Buffer (portable en RN/Hermes). */
function decodeSegment(seg: string): AccessClaims | null {
  try {
    const norm = seg.replace(/-/g, '+').replace(/_/g, '/');
    let bytes = '';
    let buffer = 0;
    let bits = 0;
    for (const ch of norm) {
      const idx = B64.indexOf(ch);
      if (idx === -1) continue;
      buffer = (buffer << 6) | idx;
      bits += 6;
      if (bits >= 8) {
        bits -= 8;
        bytes += String.fromCharCode((buffer >> bits) & 0xff);
      }
    }
    const json = decodeURIComponent(
      bytes
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );
    return JSON.parse(json) as AccessClaims;
  } catch {
    return null;
  }
}

/** Claims del token. Se leen aunque `exp` ya haya pasado: el rol sigue siendo legible. */
export function claimsOf(token: string | null | undefined): AccessClaims | null {
  const payload = token?.split('.')[1];
  if (!payload) return null;
  return decodeSegment(payload);
}

/**
 * ¿El token sigue vigente? Margen de 30 s igual que la web (`SKEW_SECONDS` en
 * `apps/web/lib/auth.ts`) para no usar un access a punto de expirar.
 */
export function isTokenFresh(token: string | null | undefined, skewSeconds = 30): boolean {
  const claims = claimsOf(token);
  if (typeof claims?.exp !== 'number') return false;
  return (claims.exp - skewSeconds) * 1000 > Date.now();
}

/** ¿Los claims portan rol `validator`? El servidor verifica la firma; esto es gating de UX. */
export function hasValidatorRole(claims: AccessClaims | null): boolean {
  return claims?.roles?.includes('validator') === true;
}

/**
 * Qué hacer con el par guardado antes de una petición autenticada.
 *
 * `dead` es lo único que expulsa a login. Un access vencido con refresh vigente
 * NO es sesión muerta: es una renovación pendiente.
 */
export function sessionActionFor(pair: {
  accessToken: string | null;
  refreshToken: string | null;
}): 'use' | 'refresh' | 'dead' {
  if (!pair.refreshToken || !isTokenFresh(pair.refreshToken, 0)) return 'dead';
  if (!hasValidatorRole(claimsOf(pair.accessToken))) return 'dead';
  return isTokenFresh(pair.accessToken) ? 'use' : 'refresh';
}

/**
 * Qué hacer cuando la renovación falla. `status` es `null` si no hubo respuesta
 * del servidor (fallo de red): la puerta sigue operando y encolando (§2.5).
 * Solo un rechazo explícito del refresh mata la sesión.
 */
export function refreshFailureAction(status: number | null): 'offline' | 'dead' {
  if (status === null) return 'offline';
  return status === 401 || status === 400 ? 'dead' : 'offline';
}
```

- [ ] **Step 6: Correr los tests para verificar que pasan**

```bash
pnpm --filter @urnight/validator test
```

Esperado: PASS, 20 tests.

- [ ] **Step 7: Verificar tipos y lint**

```bash
pnpm --filter @urnight/validator typecheck
pnpm --filter @urnight/validator lint
```

Esperado: sin salida de error en ninguno.

- [ ] **Step 8: Commit**

```bash
git add apps/validator/package.json apps/validator/vitest.config.ts apps/validator/lib/session-rules.ts apps/validator/lib/session-rules.spec.ts pnpm-lock.yaml
git commit -m "test(validator): reglas puras de sesión y arranque de Vitest

El validador no tenía ni un test. Se monta Vitest con la misma
configuración que apps/mobile (entorno node, solo lib/**/*.spec.ts) y se
extrae a session-rules.ts la lógica de claims, frescura y decisión de
sesión, que hoy vive mezclada con expo-secure-store en auth.ts y por eso
no se puede probar.

sessionActionFor deja explícito el cambio de criterio del diseño: un
access vencido con refresh vigente ya no es sesión muerta.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Cliente HTTP con problem+json, refresh y logout

**Files:**
- Modify: `apps/validator/lib/api-client.ts`

**Interfaces:**
- Consumes: nada de la Tarea 1.
- Produces:
  - `class ApiError extends Error` con `readonly status: number`, `readonly code?: string`, `readonly fieldErrors?: Record<string, string[]>`
  - `refreshRequest(refreshToken: string): Promise<AuthTokensResponse>`
  - `logoutRequest(refreshToken: string): Promise<void>`
  - Se mantienen sin cambios de firma: `login(email, password)`, `validateQr(qrCode, token, localId?)`, `fetchHealth()`, `NetworkError`.

**Nota sobre TDD en esta tarea:** no lleva test unitario. Es un adaptador de I/O contra `fetch`, y el repositorio no prueba adaptadores de este tipo en ninguna de las dos apps nativas (`apps/mobile/lib/api-client.ts` tampoco tiene spec). La política que este adaptador alimenta —qué status mata la sesión— ya está probada en `refreshFailureAction` (Tarea 1). La verificación aquí es typecheck, lint y que la suite existente siga verde.

- [ ] **Step 1: Importar el schema de problem+json**

En `apps/validator/lib/api-client.ts`, reemplazar la primera línea de imports:

```ts
import type { AuthTokensResponse, QrValidationResponse } from '@urnight/contracts';
```

por:

```ts
import {
  problemDetailsSchema,
  type AuthTokensResponse,
  type ProblemDetails,
  type QrValidationResponse,
} from '@urnight/contracts';
```

- [ ] **Step 2: Enriquecer `ApiError`**

Reemplazar la clase `ApiError` completa:

```ts
/** Respuesta HTTP no-2xx del servidor. */
export class ApiError extends Error {
  constructor(readonly status: number) {
    super(`api_error: ${status}`);
    this.name = 'ApiError';
  }
}
```

por:

```ts
/**
 * Respuesta HTTP no-2xx del servidor, con el problem+json parseado (RFC 7807).
 * `code` es lo que distingue un refresh rechazado (`identity/invalid-token`) de
 * un 5xx transitorio, y por tanto lo que decide si la sesión muere (§2.5).
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly fieldErrors?: Record<string, string[]>;

  constructor(status: number, problem?: Partial<ProblemDetails>) {
    super(problem?.detail ?? problem?.title ?? `api_error: ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.code = problem?.code;
    this.fieldErrors = problem?.errors;
  }
}

/** Lee el cuerpo problem+json de una respuesta de error; `undefined` si no lo es. */
async function problemOf(res: Response): Promise<Partial<ProblemDetails> | undefined> {
  try {
    return problemDetailsSchema.partial().parse(await res.json());
  } catch {
    return undefined;
  }
}
```

- [ ] **Step 3: Propagar el problem+json en `login` y `validateQr`**

En `login`, reemplazar el bloque de error:

```ts
  if (!res.ok) {
    log.warn({ path: '/auth/login', status: res.status }, 'validator.api.login.error');
    throw new ApiError(res.status);
  }
```

por:

```ts
  if (!res.ok) {
    const problem = await problemOf(res);
    log.warn(
      { path: '/auth/login', status: res.status, code: problem?.code },
      'validator.api.login.error',
    );
    throw new ApiError(res.status, problem);
  }
```

En `validateQr`, reemplazar:

```ts
  if (!res.ok) {
    log.warn({ path: '/validations/scan', status: res.status }, 'validator.api.validate.error');
    throw new ApiError(res.status);
  }
```

por:

```ts
  if (!res.ok) {
    const problem = await problemOf(res);
    log.warn(
      { path: '/validations/scan', status: res.status, code: problem?.code },
      'validator.api.validate.error',
    );
    throw new ApiError(res.status, problem);
  }
```

- [ ] **Step 4: Añadir `refreshRequest` y `logoutRequest`**

Al final de `apps/validator/lib/api-client.ts`:

```ts
/**
 * Renueva el par de tokens (POST /auth/refresh). La rotación del backend es de
 * un solo uso: reutilizar un refresh ya consumido revoca TODA la familia del
 * usuario, incluida su sesión web. Por eso el llamador debe serializar las
 * renovaciones (single-flight en `auth-context`), nunca lanzarlas en paralelo.
 */
export async function refreshRequest(refreshToken: string): Promise<AuthTokensResponse> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
  } catch (err) {
    log.warn({ path: '/auth/refresh' }, 'validator.api.refresh.network_error');
    throw new NetworkError(err);
  }
  if (!res.ok) {
    const problem = await problemOf(res);
    log.warn(
      { path: '/auth/refresh', status: res.status, code: problem?.code },
      'validator.api.refresh.error',
    );
    throw new ApiError(res.status, problem);
  }
  return (await res.json()) as AuthTokensResponse;
}

/**
 * Cierra sesión en servidor revocando el refresh (POST /auth/logout, 204). El
 * llamador borra el par local aunque esto falle: sin red no se puede revocar,
 * pero tampoco se puede dejar la sesión viva en el dispositivo.
 */
export async function logoutRequest(refreshToken: string): Promise<void> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
  } catch (err) {
    log.warn({ path: '/auth/logout' }, 'validator.api.logout.network_error');
    throw new NetworkError(err);
  }
  if (!res.ok) {
    const problem = await problemOf(res);
    log.warn(
      { path: '/auth/logout', status: res.status, code: problem?.code },
      'validator.api.logout.error',
    );
    throw new ApiError(res.status, problem);
  }
}
```

- [ ] **Step 5: Verificar**

```bash
pnpm --filter @urnight/validator typecheck
pnpm --filter @urnight/validator lint
pnpm --filter @urnight/validator test
```

Esperado: typecheck y lint sin errores; los 20 tests de la Tarea 1 siguen en verde.

- [ ] **Step 6: Commit**

```bash
git add apps/validator/lib/api-client.ts
git commit -m "feat(validator): problem+json en ApiError y endpoints de refresh y logout

ApiError solo llevaba status, así que era imposible distinguir un refresh
rechazado de un 5xx transitorio — justo la distinción que decide si la
sesión muere. Ahora parsea el problem+json de la API y expone code y
fieldErrors, igual que el cliente de apps/mobile y el de la web.

Añade refreshRequest y logoutRequest contra POST /auth/refresh y
POST /auth/logout, que ya existen en auth.controller.ts.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Par de tokens, single-flight y política offline

**Files:**
- Modify: `apps/validator/lib/auth.ts` (reescritura)
- Modify: `apps/validator/lib/auth-context.tsx` (reescritura)
- Modify: `apps/validator/app/_layout.tsx:7-20`
- Modify: `apps/validator/app/scan.tsx:34-72`

**Interfaces:**
- Consumes de la Tarea 1: `claimsOf`, `hasValidatorRole`, `isTokenFresh`, `sessionActionFor`, `refreshFailureAction`, `AccessClaims`.
- Consumes de la Tarea 2: `ApiError`, `NetworkError`, `refreshRequest`, `logoutRequest`, `login`, `validateQr`.
- Produces:
  - `interface TokenPair { accessToken: string; refreshToken: string }`
  - `getStoredTokens(): Promise<TokenPair | null>`, `storeTokens(tokens: AuthTokensResponse | TokenPair): Promise<void>`, `clearTokens(): Promise<void>`, `class NotValidatorError`
  - `useAuth(): AuthState` con `status: 'restoring' | 'guest' | 'authenticated'`, `claims: AccessClaims | null`, `getAccessToken(): Promise<string | null>`, `refreshAccessToken(): Promise<string | null>`, `signIn(email, password)`, `signOut()`, `runSync(): Promise<number>`

**Nota sobre TDD:** las tres piezas nuevas de decisión ya están probadas en la Tarea 1. Lo que queda aquí es cableado de React y adaptadores de SecureStore, que el repositorio no prueba en ninguna app nativa. La verificación es typecheck, lint, suite en verde y la checklist de dispositivo de la Tarea 9.

- [ ] **Step 1: Reescribir `lib/auth.ts` al par de tokens**

Reemplazar **todo** el contenido de `apps/validator/lib/auth.ts`:

```ts
import type { AuthTokensResponse } from '@urnight/contracts';
import * as SecureStore from 'expo-secure-store';
import { createLogger } from './logger';

/**
 * Sesión del validador (§2.2 del diseño): el par de tokens emitido por la API
 * se guarda en almacenamiento seguro del dispositivo (Keychain/Keystore). Este
 * fichero contiene SOLO lo que toca plataforma; la lógica de claims y de
 * decisión vive en `session-rules.ts`, que sí se puede probar.
 *
 * `ACCESS_KEY` conserva su valor histórico a propósito: cambiarlo invalidaría
 * la sesión de cualquier dispositivo ya en uso.
 */
const log = createLogger('auth');
const ACCESS_KEY = 'urnight_validator_access_token';
const REFRESH_KEY = 'urnight_validator_refresh_token';

/** La cuenta autenticó pero no tiene rol `validator` → no puede validar en puerta. */
export class NotValidatorError extends Error {
  constructor() {
    super('not_validator');
    this.name = 'NotValidatorError';
  }
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export async function getStoredTokens(): Promise<TokenPair | null> {
  try {
    const [accessToken, refreshToken] = await Promise.all([
      SecureStore.getItemAsync(ACCESS_KEY),
      SecureStore.getItemAsync(REFRESH_KEY),
    ]);
    if (!accessToken || !refreshToken) return null;
    return { accessToken, refreshToken };
  } catch (err) {
    log.warn({ err: (err as Error).message }, 'validator.auth.read_failed');
    return null;
  }
}

export async function storeTokens(tokens: AuthTokensResponse | TokenPair): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync(ACCESS_KEY, tokens.accessToken),
    SecureStore.setItemAsync(REFRESH_KEY, tokens.refreshToken),
  ]);
}

export async function clearTokens(): Promise<void> {
  try {
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS_KEY),
      SecureStore.deleteItemAsync(REFRESH_KEY),
    ]);
  } catch (err) {
    log.warn({ err: (err as Error).message }, 'validator.auth.clear_failed');
  }
}
```

- [ ] **Step 2: Reescribir `lib/auth-context.tsx`**

Reemplazar **todo** el contenido de `apps/validator/lib/auth-context.tsx`:

```tsx
import NetInfo from '@react-native-community/netinfo';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AppState } from 'react-native';
import {
  ApiError,
  login as apiLogin,
  logoutRequest,
  refreshRequest,
  validateQr,
} from './api-client';
import {
  clearTokens,
  getStoredTokens,
  NotValidatorError,
  storeTokens,
  type TokenPair,
} from './auth';
import { createLogger } from './logger';
import { syncPending } from './offline-cache';
import {
  claimsOf,
  hasValidatorRole,
  isTokenFresh,
  refreshFailureAction,
  sessionActionFor,
  type AccessClaims,
} from './session-rules';

const log = createLogger('auth-context');

type SessionStatus = 'restoring' | 'guest' | 'authenticated';

interface AuthState {
  /** `restoring` mientras se rehidrata desde SecureStore al arrancar. */
  status: SessionStatus;
  /** Claims del access para gating de UX; la firma la valida la API. */
  claims: AccessClaims | null;
  /** Access vigente, renovando si hace falta. `null` sin sesión o sin red. */
  getAccessToken(): Promise<string | null>;
  /** Fuerza una renovación: para reintentar tras un 401 con access no expirado. */
  refreshAccessToken(): Promise<string | null>;
  signIn(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
  /** Fuerza un intento de sincronización de la cola offline. */
  runSync(): Promise<number>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<SessionStatus>('restoring');
  const [claims, setClaims] = useState<AccessClaims | null>(null);
  const tokensRef = useRef<TokenPair | null>(null);
  // Mutex single-flight: la rotación del refresh es de un solo uso y su
  // reutilización revoca TODAS las sesiones del usuario, incluida la web.
  // Jamás dos renovaciones en paralelo.
  const refreshInFlight = useRef<Promise<string | null> | null>(null);

  const applySession = useCallback((tokens: TokenPair | null) => {
    tokensRef.current = tokens;
    setClaims(tokens ? claimsOf(tokens.accessToken) : null);
    setStatus(tokens ? 'authenticated' : 'guest');
  }, []);

  const killSession = useCallback(async () => {
    await clearTokens();
    applySession(null);
  }, [applySession]);

  // Rehidratar al arrancar: hay sesión mientras el refresh siga vigente, aunque
  // el access haya expirado — se renovará on-demand.
  useEffect(() => {
    getStoredTokens().then((stored) => {
      if (stored && sessionActionFor(stored) !== 'dead') {
        applySession(stored);
      } else {
        if (stored) void clearTokens();
        applySession(null);
      }
    });
  }, [applySession]);

  const refreshAccessToken = useCallback((): Promise<string | null> => {
    if (refreshInFlight.current) return refreshInFlight.current;
    const run = (async (): Promise<string | null> => {
      const current = tokensRef.current;
      if (!current) return null;
      try {
        const rotated = await refreshRequest(current.refreshToken);
        await storeTokens(rotated);
        applySession(rotated);
        log.info({}, 'validator.auth.refreshed');
        return rotated.accessToken;
      } catch (err) {
        const httpStatus = err instanceof ApiError ? err.status : null;
        if (refreshFailureAction(httpStatus) === 'dead') {
          log.warn({ status: httpStatus }, 'validator.auth.refresh_rejected');
          await killSession();
        } else {
          // Fallo de red o 5xx: la puerta sigue operando y encolando.
          log.warn({ err: (err as Error).message }, 'validator.auth.refresh_failed');
        }
        return null;
      }
    })();
    refreshInFlight.current = run.finally(() => {
      refreshInFlight.current = null;
    });
    return refreshInFlight.current;
  }, [applySession, killSession]);

  const getAccessToken = useCallback(async (): Promise<string | null> => {
    const current = tokensRef.current;
    if (!current) return null;
    const action = sessionActionFor(current);
    if (action === 'use') return current.accessToken;
    if (action === 'dead') {
      await killSession();
      return null;
    }
    return refreshAccessToken();
  }, [killSession, refreshAccessToken]);

  const runSync = useCallback(async (): Promise<number> => {
    const token = await getAccessToken();
    if (!token) return 0;
    try {
      return await syncPending((qr) => validateQr(qr, token));
    } catch (err) {
      log.warn({ err: (err as Error).message }, 'validator.sync.run_failed');
      return 0;
    }
  }, [getAccessToken]);

  // Sync al montar con sesión y al recuperar red.
  useEffect(() => {
    if (status !== 'authenticated') return;
    void runSync();
    let wasConnected = true;
    const unsubscribe = NetInfo.addEventListener((state) => {
      const connected = state.isConnected === true && state.isInternetReachable !== false;
      if (connected && !wasConnected) {
        log.info({}, 'validator.net.reconnected');
        void runSync();
      }
      wasConnected = connected;
    });
    return unsubscribe;
  }, [status, runSync]);

  // Renovación anticipada al volver a primer plano, en vez de esperar un 401:
  // en puerta el teléfono entra y sale de suspensión entre escaneos.
  useEffect(() => {
    if (status !== 'authenticated') return;
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active' && tokensRef.current && !isTokenFresh(tokensRef.current.accessToken)) {
        void refreshAccessToken();
      }
    });
    return () => sub.remove();
  }, [status, refreshAccessToken]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const tokens = await apiLogin(email, password);
      if (!hasValidatorRole(claimsOf(tokens.accessToken))) {
        throw new NotValidatorError();
      }
      await storeTokens(tokens);
      applySession(tokens);
      log.info({}, 'validator.auth.signed_in');
    },
    [applySession],
  );

  const signOut = useCallback(async () => {
    const current = tokensRef.current;
    // Se revoca en servidor, pero el par local se borra pase lo que pase.
    if (current) {
      try {
        await logoutRequest(current.refreshToken);
      } catch (err) {
        log.warn({ err: (err as Error).message }, 'validator.auth.logout_server_failed');
      }
    }
    await clearTokens();
    applySession(null);
    log.info({}, 'validator.auth.signed_out');
  }, [applySession]);

  return (
    <AuthContext.Provider
      value={{ status, claims, getAccessToken, refreshAccessToken, signIn, signOut, runSync }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
```

- [ ] **Step 3: Adaptar el gate de `app/_layout.tsx`**

En `apps/validator/app/_layout.tsx`, reemplazar la función `AuthGate` completa:

```tsx
/** Redirige a /login sin sesión válida y fuera de /login con sesión (§5). */
function AuthGate() {
  const { token, isReady } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isReady) return;
    const onLogin = segments[0] === 'login';
    if (!token && !onLogin) router.replace('/login');
    else if (token && onLogin) router.replace('/');
  }, [token, isReady, segments, router]);

  return <Stack screenOptions={{ headerTitle: 'Ravenue Validador' }} />;
}
```

por:

```tsx
/** Redirige a /login sin sesión y fuera de /login con sesión (§5). */
function AuthGate() {
  const { status } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (status === 'restoring') return;
    const onLogin = segments[0] === 'login';
    if (status === 'guest' && !onLogin) router.replace('/login');
    else if (status === 'authenticated' && onLogin) router.replace('/');
  }, [status, segments, router]);

  return <Stack screenOptions={{ headerTitle: 'Ravenue Validador' }} />;
}
```

- [ ] **Step 4: Adaptar la rama de sesión de `app/scan.tsx`**

En `apps/validator/app/scan.tsx`, reemplazar la desestructuración del contexto:

```tsx
  const { token, signOut } = useAuth();
```

por:

```tsx
  const { getAccessToken, refreshAccessToken, signOut } = useAuth();
```

Y reemplazar la función `handleScan` completa por:

```tsx
  /** Encola el escaneo y deja el aviso ámbar en pantalla. */
  async function queueOffline(code: string, scannedAt: string) {
    await queueCheckin(code, scannedAt).catch((e) =>
      log.error({ err: (e as Error).message }, 'validator.checkin.queue_failed'),
    );
    setOutcome({
      verdict: 'offline',
      message: 'Sin conexión. Se sincronizará al recuperar red.',
    });
  }

  async function handleScan(data: string) {
    if (busy || data === lastCode) return;
    setBusy(true);
    setLastCode(data);
    // Solo metadatos: el contenido del QR nunca se loguea (§6).
    log.info({ length: data.length }, 'validator.qr.scanned');
    const scannedAt = new Date().toISOString();
    try {
      const token = await getAccessToken();
      if (!token) {
        // Sin token utilizable. O no hubo red para renovar —y entonces la puerta
        // sigue operando encolando (§2.5)— o la sesión murió, en cuyo caso el
        // gate de _layout ya está llevando a login.
        await queueOffline(data, scannedAt);
        return;
      }
      const res = await validateQr(data, token);
      log.info({ result: res.result }, 'validator.qr.validated');
      setOutcome({ verdict: res.result, message: res.message });
    } catch (err) {
      if (err instanceof NetworkError) {
        await queueOffline(data, scannedAt);
      } else if (err instanceof ApiError && err.status === 401) {
        // El servidor rechazó el access aunque no hubiera expirado (revocado):
        // renovar a la fuerza y reintentar UNA vez (§2.6).
        log.warn({}, 'validator.qr.unauthorized');
        const fresh = await refreshAccessToken();
        if (!fresh) {
          await queueOffline(data, scannedAt);
          return;
        }
        try {
          const res = await validateQr(data, fresh);
          log.info({ result: res.result }, 'validator.qr.validated');
          setOutcome({ verdict: res.result, message: res.message });
        } catch (retryErr) {
          if (retryErr instanceof NetworkError) {
            await queueOffline(data, scannedAt);
          } else {
            log.warn({}, 'validator.qr.session_dead');
            await signOut();
            router.replace('/login');
          }
        }
      } else {
        log.error({ err: (err as Error).message }, 'validator.qr.validate_failed');
        setOutcome({ verdict: 'error', message: 'No se pudo validar. Inténtalo de nuevo.' });
      }
    } finally {
      setBusy(false);
    }
  }
```

- [ ] **Step 5: Verificar**

```bash
pnpm --filter @urnight/validator typecheck
pnpm --filter @urnight/validator lint
pnpm --filter @urnight/validator test
```

Esperado: typecheck y lint limpios; 20 tests en verde. Si typecheck se queja de `token` o `isReady` en alguna pantalla, es que quedó un consumidor del contrato viejo: `index.tsx` solo usa `runSync` y `signOut`, y `login.tsx` solo usa `signIn`, así que no deberían aparecer.

- [ ] **Step 6: Commit**

```bash
git add apps/validator/lib/auth.ts apps/validator/lib/auth-context.tsx apps/validator/app/_layout.tsx apps/validator/app/scan.tsx
git commit -m "feat(validator): sesión con par de tokens y renovación single-flight

Cierra la brecha §9-4 de 90-canales-moviles: el validador guardaba solo
el access token y ante un 401 cerraba sesión, lo que en una noche de
puerta significa re-loguear a mitad de turno.

Ahora guarda el par completo y renueva con mutex single-flight, porque la
rotación del backend es de un solo uso y dos renovaciones en paralelo
revocan toda la familia del usuario, incluida su sesión web. Suma
renovación anticipada al volver a primer plano.

Política offline: mientras el refresh siga vigente, un fallo de RED al
renovar no cierra la sesión — el escaneo se encola y la puerta sigue
operando. Solo un rechazo explícito del servidor (401/400) la mata.

Un 401 del escaneo pasa a renovar y reintentar una vez antes de rendirse.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Tokens del DS, primitivos y estado de red

**Files:**
- Create: `apps/validator/lib/theme.ts`
- Create: `apps/validator/components/ui.tsx`
- Create: `apps/validator/lib/net.ts`

**Interfaces:**
- Consumes: nada.
- Produces:
  - `theme.ts`: `color`, `radius`, `space`, `type` (objetos `as const`)
  - `ui.tsx`: `Eyebrow`, `Chip`, `Button`, `Field`, `LoadingState`
  - `net.ts`: `useIsOnline(): boolean`

**Nota sobre TDD:** son tokens y componentes de presentación; no llevan test propio. Lo que sí se prueba, en la Tarea 7, es el mapa que decide qué token de color usa cada veredicto.

- [ ] **Step 1: Copiar los tokens**

Copiar `apps/mobile/lib/theme.ts` a `apps/validator/lib/theme.ts` **sin modificar una sola línea**:

```bash
cp apps/mobile/lib/theme.ts apps/validator/lib/theme.ts
```

Verificar que el fichero copiado empieza con el comentario `RAVENUE Design System — tokens nativos (§7 canal móvil).` y exporta `color`, `radius`, `space` y `type`.

- [ ] **Step 2: Crear los primitivos**

Crear `apps/validator/components/ui.tsx`. Es el subconjunto de `apps/mobile/components/ui.tsx` que la app de puerta usa de verdad — `SectionHead`, `ErrorState` y `EmptyState` no viajan porque nadie los llamaría:

```tsx
/** Primitivos de UI del DS RAVENUE para la app de puerta (subconjunto del espejo de apps/mobile). */
import type { PropsWithChildren } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { color, radius, space, type } from '../lib/theme';

/** Eyebrow en mayúsculas espaciadas (labels de sección). */
export function Eyebrow({ children }: PropsWithChildren) {
  return <Text style={styles.eyebrow}>{children}</Text>;
}

/** Pill oscura con hairline; el tono lo decide el llamador (estado de red). */
export function Chip({
  label,
  tone = 'neutral',
}: {
  label: string;
  tone?: 'neutral' | 'success' | 'warning';
}) {
  return (
    <View style={[styles.chip, tone === 'success' && styles.chipSuccess, tone === 'warning' && styles.chipWarning]}>
      <Text
        style={[
          styles.chipText,
          tone === 'success' && styles.chipTextSuccess,
          tone === 'warning' && styles.chipTextWarning,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  style,
}: {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        variant === 'primary' ? styles.buttonPrimary : styles.buttonSecondary,
        disabled && styles.buttonDisabled,
        pressed && !disabled && styles.buttonPressed,
        style,
      ]}
    >
      <Text
        style={[
          styles.buttonText,
          variant === 'secondary' && styles.buttonTextSecondary,
          disabled && styles.buttonTextDisabled,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/** Campo de formulario del DS: label + input oscuro + mensaje de error. */
export function Field({
  label,
  error,
  ...inputProps
}: TextInputProps & { label: string; error?: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        placeholderTextColor={color.textFaint}
        style={[styles.fieldInput, error ? styles.fieldInputError : null]}
        {...inputProps}
      />
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

export function LoadingState({ label = 'Abriendo la puerta…' }: { label?: string }) {
  return (
    <View style={styles.stateBox}>
      <ActivityIndicator color={color.crimson} size="large" />
      <Text style={styles.stateSubtitle}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    ...type.eyebrow,
    color: color.smoke,
    textTransform: 'uppercase',
  },
  chip: {
    height: 34,
    paddingHorizontal: space.s4 - 2,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: color.borderSoft,
    backgroundColor: color.bgSurface,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  chipSuccess: {
    backgroundColor: color.successSoft,
    borderColor: color.success,
  },
  chipWarning: {
    backgroundColor: color.warningSoft,
    borderColor: color.warning,
  },
  chipText: {
    ...type.label,
    color: color.textSecondary,
  },
  chipTextSuccess: {
    color: color.successFg,
  },
  chipTextWarning: {
    color: color.warningFg,
  },
  button: {
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.s6,
  },
  buttonPrimary: {
    backgroundColor: color.crimson,
  },
  buttonSecondary: {
    backgroundColor: color.secondaryFill,
    borderWidth: 1,
    borderColor: color.steel,
  },
  buttonDisabled: {
    backgroundColor: color.bgElevated,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    ...type.label,
    fontSize: 15,
    color: color.textOnAccent,
  },
  buttonTextSecondary: {
    color: color.textPrimary,
  },
  buttonTextDisabled: {
    color: color.textFaint,
  },
  field: {
    gap: space.s2 - 2,
  },
  fieldLabel: {
    ...type.label,
    color: color.textSecondary,
  },
  fieldInput: {
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: color.steel,
    backgroundColor: color.fieldBg,
    paddingHorizontal: space.s4 - 2,
    ...type.body,
    lineHeight: undefined,
    color: color.textPrimary,
  },
  fieldInputError: {
    borderColor: color.error,
  },
  fieldError: {
    ...type.caption,
    color: color.errorFg,
  },
  stateBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.s8,
    gap: space.s2,
    backgroundColor: color.bgRoot,
  },
  stateSubtitle: {
    ...type.bodySm,
    color: color.textMuted,
    textAlign: 'center',
  },
});
```

- [ ] **Step 3: Crear el hook de estado de red**

Crear `apps/validator/lib/net.ts`:

```ts
import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';

/**
 * Estado de conexión (mismo mecanismo que el listener de `auth-context`). Se
 * asume conectado al arrancar: es preferible intentar la petición y fallar a
 * bloquear la pantalla por un estado que aún no llegó.
 */
export function useIsOnline(): boolean {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setOnline(state.isConnected !== false);
    });
    return unsubscribe;
  }, []);
  return online;
}
```

- [ ] **Step 4: Verificar**

```bash
pnpm --filter @urnight/validator typecheck
pnpm --filter @urnight/validator lint
pnpm --filter @urnight/validator test
```

Esperado: todo limpio. Los tres ficheros están creados pero aún no los consume nadie; eso es correcto en esta tarea.

- [ ] **Step 5: Commit**

```bash
git add apps/validator/lib/theme.ts apps/validator/components/ui.tsx apps/validator/lib/net.ts
git commit -m "feat(validator): tokens del DS RAVENUE, primitivos y estado de red

Copia los tokens de apps/mobile/lib/theme.ts sin tocarlos y añade el
subconjunto de primitivos que la app de puerta usa: Eyebrow, Chip,
Button, Field y LoadingState. SectionHead, ErrorState y EmptyState no
viajan porque ninguna de las tres pantallas los llamaría.

El Chip lleva tono neutral/success/warning en vez del active del móvil:
aquí lo que comunica es el estado de la conexión, no un filtro.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Layout tematizado y login con el DS

**Files:**
- Modify: `apps/validator/app/_layout.tsx` (reescritura)
- Modify: `apps/validator/app/login.tsx` (reescritura)

**Interfaces:**
- Consumes de la Tarea 3: `useAuth()` con `status`, `signIn`; `NotValidatorError` de `lib/auth`.
- Consumes de la Tarea 4: `color`, `radius`, `space`, `type`; `Button`, `Eyebrow`, `Field`, `LoadingState`.
- Consumes de la Tarea 2: `ApiError`, `NetworkError`.
- Produces: nada que consuman otras tareas.

- [ ] **Step 1: Reescribir `app/_layout.tsx`**

Reemplazar **todo** el contenido de `apps/validator/app/_layout.tsx`:

```tsx
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from '../lib/auth-context';
import { color } from '../lib/theme';

/** Redirige a /login sin sesión y fuera de /login con sesión (§5). */
function AuthGate() {
  const { status } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (status === 'restoring') return;
    const onLogin = segments[0] === 'login';
    if (status === 'guest' && !onLogin) router.replace('/login');
    else if (status === 'authenticated' && onLogin) router.replace('/');
  }, [status, segments, router]);

  // El Stack se monta SIEMPRE, incluso rehidratando: expo-router necesita un
  // navegador en la raíz y devolver otra cosa provoca "Attempted to navigate
  // before mounting the Root Layout". El estado de carga lo pinta `index`.
  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: color.bgRoot },
        headerStyle: { backgroundColor: color.bgBase },
        headerTintColor: color.textPrimary,
        headerTitleStyle: { color: color.textPrimary },
        headerTitle: 'Ravenue Validador',
      }}
    >
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="scan" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <AuthGate />
    </AuthProvider>
  );
}
```

Nota: `LoadingState` no se importa aquí. Lo consume `app/index.tsx` en la Tarea 6.

- [ ] **Step 2: Reescribir `app/login.tsx`**

Reemplazar **todo** el contenido de `apps/validator/app/login.tsx`:

```tsx
/** Login del validador (§5): email+contraseña contra POST /auth/login, exige rol validator. */
import { IDENTITY_ERROR_CODES, loginSchema } from '@urnight/contracts';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ApiError, NetworkError } from '../lib/api-client';
import { NotValidatorError } from '../lib/auth';
import { useAuth } from '../lib/auth-context';
import { color, radius, space, type } from '../lib/theme';
import { Button, Eyebrow, Field } from '../components/ui';

interface FieldErrors {
  email?: string;
  password?: string;
}

/** Traduce el fallo del API a copy de UX (códigos problem+json de identidad). */
function messageOf(err: unknown): string {
  if (err instanceof NotValidatorError) {
    return 'Esta cuenta no tiene permisos de validador.';
  }
  if (err instanceof NetworkError) {
    return 'Sin conexión. Verifica la red e inténtalo de nuevo.';
  }
  if (err instanceof ApiError) {
    if (err.code === IDENTITY_ERROR_CODES.INVALID_CREDENTIALS || err.status === 401) {
      return 'Correo o contraseña incorrectos.';
    }
    if (err.code === IDENTITY_ERROR_CODES.ACCOUNT_DISABLED) {
      return 'Tu cuenta está deshabilitada. Escríbenos para reactivarla.';
    }
    if (err.status === 429) {
      return 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.';
    }
    return 'No se pudo iniciar sesión.';
  }
  return 'No se pudo iniciar sesión. Inténtalo de nuevo.';
}

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit() {
    if (pending) return;
    setFormError(null);
    const parsed = loginSchema.safeParse({ email: email.trim(), password });
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      setFieldErrors({
        email: flat.email ? 'Ingresa un correo válido.' : undefined,
        password: flat.password ? 'Ingresa tu contraseña.' : undefined,
      });
      return;
    }
    setFieldErrors({});
    setPending(true);
    try {
      await signIn(parsed.data.email, parsed.data.password);
      // El gate de _layout redirige a "/" al detectar la sesión.
    } catch (err) {
      setFormError(messageOf(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Eyebrow>Puerta · Ravenue</Eyebrow>
            <Text style={styles.title}>Validación de puerta</Text>
            <Text style={styles.subtitle}>Inicia sesión con tu cuenta de validador</Text>
          </View>

          <View style={styles.form}>
            {formError ? (
              <View style={styles.alert}>
                <Text style={styles.alertText}>{formError}</Text>
              </View>
            ) : null}

            <Field
              label="Correo"
              placeholder="tu@correo.com"
              value={email}
              onChangeText={setEmail}
              error={fieldErrors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              editable={!pending}
            />
            <Field
              label="Contraseña"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              error={fieldErrors.password}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="current-password"
              textContentType="password"
              editable={!pending}
              onSubmitEditing={() => void onSubmit()}
              returnKeyType="go"
            />

            <Button
              label={pending ? 'Ingresando…' : 'Ingresar'}
              onPress={() => void onSubmit()}
              disabled={pending || !email || !password}
              style={styles.submit}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: color.bgRoot,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: space.s6,
    gap: space.s8,
  },
  header: {
    gap: space.s2,
  },
  title: {
    ...type.h1,
    color: color.textPrimary,
  },
  subtitle: {
    ...type.body,
    color: color.textSecondary,
  },
  form: {
    gap: space.s4,
  },
  alert: {
    backgroundColor: color.errorSoft,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: color.error,
    padding: space.s3,
  },
  alertText: {
    ...type.bodySm,
    color: color.errorFg,
  },
  submit: {
    marginTop: space.s2,
  },
});
```

- [ ] **Step 3: Verificar**

```bash
pnpm --filter @urnight/validator typecheck
pnpm --filter @urnight/validator lint
pnpm --filter @urnight/validator test
```

Esperado: todo limpio.

- [ ] **Step 4: Commit**

```bash
git add apps/validator/app/_layout.tsx apps/validator/app/login.tsx
git commit -m "feat(validator): layout y login con el Design System RAVENUE

El Stack pasa a dark-first con los tokens del DS y el gate deja de
mostrar una pantalla en blanco mientras rehidrata: pinta LoadingState.
scan pierde el header para que la cámara vaya a sangre.

El login se rehace como espejo del de apps/mobile: valida con loginSchema
antes de pegarle al API y mapea los códigos problem+json de identidad a
copy, en vez de tratar cualquier fallo como credenciales malas.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: Panel de turno

**Files:**
- Modify: `apps/validator/app/index.tsx` (reescritura)

**Interfaces:**
- Consumes de la Tarea 3: `useAuth()` con `status`, `runSync`, `signOut`.
- Consumes de la Tarea 4: `useIsOnline`, `Button`, `Chip`, `Eyebrow`, `LoadingState`, tokens.
- Consumes de lo existente: `countPending()` de `lib/offline-cache`.
- Produces: nada que consuman otras tareas.

- [ ] **Step 1: Reescribir `app/index.tsx`**

Reemplazar **todo** el contenido de `apps/validator/app/index.tsx`:

```tsx
/** Panel de turno de la app de puerta: estado de red, cola pendiente y acceso al escáner. */
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Chip, Eyebrow, LoadingState } from '../components/ui';
import { useAuth } from '../lib/auth-context';
import { useIsOnline } from '../lib/net';
import { countPending } from '../lib/offline-cache';
import { color, radius, space, type } from '../lib/theme';

export default function HomeScreen() {
  const { status, runSync, signOut } = useAuth();
  const router = useRouter();
  const online = useIsOnline();
  const [pending, setPending] = useState(0);
  const [syncing, setSyncing] = useState(false);

  const refresh = useCallback(() => {
    countPending()
      .then(setPending)
      .catch(() => setPending(0));
  }, []);

  // Recontar al enfocar (tras escanear o sincronizar).
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  async function onSync() {
    if (syncing) return;
    setSyncing(true);
    try {
      await runSync();
      refresh();
    } finally {
      setSyncing(false);
    }
  }

  // El Stack raíz se monta siempre, así que el estado de rehidratación se pinta
  // aquí en vez de dejar la pantalla en blanco mientras se lee SecureStore.
  if (status === 'restoring') {
    return (
      <SafeAreaView style={styles.safe}>
        <LoadingState />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Eyebrow>Puerta · Ravenue</Eyebrow>
          <Text style={styles.title}>Validación de puerta</Text>
        </View>

        <Chip
          label={online ? '● En línea' : '● Sin conexión'}
          tone={online ? 'success' : 'warning'}
        />

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Check-ins pendientes</Text>
          <Text style={styles.cardValue}>{pending}</Text>
          {pending > 0 && !online ? (
            <Text style={styles.cardHint}>Se enviarán solos al recuperar la red.</Text>
          ) : null}
        </View>

        <View style={styles.actions}>
          <Button label="Escanear QR" onPress={() => router.push('/scan')} />
          {pending > 0 ? (
            <Button
              label={syncing ? 'Sincronizando…' : 'Sincronizar ahora'}
              variant="secondary"
              // Sin red, pulsarlo solo produciría un fallo silencioso.
              disabled={!online || syncing}
              onPress={() => void onSync()}
            />
          ) : null}
        </View>

        <Pressable accessibilityRole="button" onPress={() => void signOut()} style={styles.signOut}>
          <Text style={styles.signOutText}>Cerrar sesión</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: color.bgRoot,
  },
  scroll: {
    flexGrow: 1,
    padding: space.s6,
    gap: space.s6,
  },
  header: {
    gap: space.s2,
  },
  title: {
    ...type.h1,
    color: color.textPrimary,
  },
  card: {
    backgroundColor: color.bgSurface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: color.borderFaint,
    padding: space.s4,
    gap: space.s1,
  },
  cardLabel: {
    ...type.label,
    color: color.textSecondary,
  },
  cardValue: {
    ...type.display,
    color: color.textPrimary,
  },
  cardHint: {
    ...type.caption,
    color: color.textMuted,
  },
  actions: {
    gap: space.s3,
  },
  signOut: {
    marginTop: 'auto',
    alignSelf: 'center',
    paddingVertical: space.s3,
  },
  signOutText: {
    ...type.bodySm,
    color: color.actionLink,
  },
});
```

- [ ] **Step 2: Verificar**

```bash
pnpm --filter @urnight/validator typecheck
pnpm --filter @urnight/validator lint
pnpm --filter @urnight/validator test
```

Esperado: todo limpio.

- [ ] **Step 3: Commit**

```bash
git add apps/validator/app/index.tsx
git commit -m "feat(validator): panel de turno con estado de red y cola pendiente

La pantalla de inicio pasa al DS y gana lo que en puerta se mira de un
vistazo: si hay red y cuántos check-ins quedan sin enviar.

Sincronizar ahora solo aparece con cola y va deshabilitado sin red:
pulsarlo offline solo producía un fallo silencioso.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: Reglas puras del escaneo

**Files:**
- Create: `apps/validator/lib/scan-rules.ts`
- Test: `apps/validator/lib/scan-rules.spec.ts`

**Interfaces:**
- Consumes de la Tarea 4: `color` de `lib/theme` (fichero puro, sin imports de React Native).
- Produces:
  - `VERDICT_AUTOCLOSE_MS = 1500`, `RESCAN_WINDOW_MS = 5000`
  - `type Verdict = 'valid' | 'already_used' | 'cancelled' | 'invalid' | 'offline' | 'error'`
  - `interface VerdictStyle { label: string; mark: string; background: string; foreground: string; haptic: 'success' | 'warning' | 'error'; autoClose: boolean }`
  - `VERDICT_STYLES: Record<Verdict, VerdictStyle>`
  - `interface LastScan { code: string; at: number }`
  - `shouldIgnoreScan(code: string, last: LastScan | null, now: number): boolean`

- [ ] **Step 1: Escribir los tests que fallan**

Crear `apps/validator/lib/scan-rules.spec.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { color } from './theme';
import {
  RESCAN_WINDOW_MS,
  shouldIgnoreScan,
  VERDICT_AUTOCLOSE_MS,
  VERDICT_STYLES,
  type Verdict,
} from './scan-rules';

describe('shouldIgnoreScan', () => {
  it('deja pasar el primer escaneo', () => {
    expect(shouldIgnoreScan('QR-A', null, 1_000)).toBe(false);
  });

  it('ignora el mismo código dentro de la ventana', () => {
    const last = { code: 'QR-A', at: 1_000 };
    expect(shouldIgnoreScan('QR-A', last, 1_000 + RESCAN_WINDOW_MS - 1)).toBe(true);
  });

  it('vuelve a aceptar el mismo código pasada la ventana', () => {
    const last = { code: 'QR-A', at: 1_000 };
    expect(shouldIgnoreScan('QR-A', last, 1_000 + RESCAN_WINDOW_MS)).toBe(false);
  });

  it('deja pasar un código distinto de inmediato', () => {
    const last = { code: 'QR-A', at: 1_000 };
    expect(shouldIgnoreScan('QR-B', last, 1_001)).toBe(false);
  });
});

describe('VERDICT_STYLES', () => {
  it('solo el acceso permitido se cierra solo', () => {
    const autoCierran = (Object.keys(VERDICT_STYLES) as Verdict[]).filter(
      (v) => VERDICT_STYLES[v].autoClose,
    );
    expect(autoCierran).toEqual(['valid']);
  });

  it('el aviso offline espera toque: es un pendiente, no un adelante', () => {
    expect(VERDICT_STYLES.offline.autoClose).toBe(false);
    expect(VERDICT_STYLES.offline.haptic).toBe('warning');
  });

  it('los rechazos vibran como error', () => {
    for (const v of ['already_used', 'cancelled', 'invalid', 'error'] as const) {
      expect(VERDICT_STYLES[v].haptic).toBe('error');
    }
  });

  it('usa texto oscuro sobre verde y ámbar, y claro sobre rojo', () => {
    expect(VERDICT_STYLES.valid.foreground).toBe(color.bgRoot);
    expect(VERDICT_STYLES.offline.foreground).toBe(color.bgRoot);
    expect(VERDICT_STYLES.invalid.foreground).toBe(color.textOnAccent);
  });

  it('toma los fondos de los tokens del DS, no de colores crudos', () => {
    expect(VERDICT_STYLES.valid.background).toBe(color.success);
    expect(VERDICT_STYLES.offline.background).toBe(color.warning);
    expect(VERDICT_STYLES.already_used.background).toBe(color.error);
  });

  it('el auto-cierre da tiempo de leer sin frenar la cola', () => {
    expect(VERDICT_AUTOCLOSE_MS).toBe(1500);
  });
});
```

- [ ] **Step 2: Correr los tests para verificar que fallan**

```bash
pnpm --filter @urnight/validator test
```

Esperado: FAIL — `Failed to resolve import "./scan-rules"`.

- [ ] **Step 3: Implementar el módulo puro**

Crear `apps/validator/lib/scan-rules.ts`:

```ts
/**
 * Reglas puras de la pantalla de escaneo. Sin imports de Expo ni de React
 * Native (los tokens del DS son TypeScript plano): se prueban en Vitest, misma
 * regla que `session-rules.ts`.
 */
import { color } from './theme';

/** Cuánto queda en pantalla un acceso permitido antes de volver a la cámara. */
export const VERDICT_AUTOCLOSE_MS = 1500;

/**
 * Ventana de dedupe. Al cerrarse solo el veredicto, la cámara vuelve a tener el
 * mismo QR delante y lo revalidaría al instante: segunda pasada que el backend
 * responde already_used, con vibración de rechazo y un pendiente falso en la
 * cola si además no hay red.
 */
export const RESCAN_WINDOW_MS = 5000;

/** Los cuatro veredictos del backend más los dos que decide el cliente. */
export type Verdict = 'valid' | 'already_used' | 'cancelled' | 'invalid' | 'offline' | 'error';

export interface VerdictStyle {
  label: string;
  mark: string;
  background: string;
  foreground: string;
  haptic: 'success' | 'warning' | 'error';
  autoClose: boolean;
}

/**
 * Presentación de cada veredicto. El contraste manda sobre la simetría: blanco
 * sobre el ámbar del DS da ~2:1 y en puerta no se lee, así que success y
 * warning llevan texto obsidiana y solo error lleva texto claro.
 */
export const VERDICT_STYLES: Record<Verdict, VerdictStyle> = {
  valid: {
    label: 'Acceso permitido',
    mark: '✓',
    background: color.success,
    foreground: color.bgRoot,
    haptic: 'success',
    autoClose: true,
  },
  already_used: {
    label: 'Ya usada',
    mark: '✕',
    background: color.error,
    foreground: color.textOnAccent,
    haptic: 'error',
    autoClose: false,
  },
  cancelled: {
    label: 'Cancelada',
    mark: '✕',
    background: color.error,
    foreground: color.textOnAccent,
    haptic: 'error',
    autoClose: false,
  },
  invalid: {
    label: 'Inválida',
    mark: '✕',
    background: color.error,
    foreground: color.textOnAccent,
    haptic: 'error',
    autoClose: false,
  },
  offline: {
    label: 'Guardado offline',
    mark: '⏱',
    background: color.warning,
    foreground: color.bgRoot,
    haptic: 'warning',
    autoClose: false,
  },
  error: {
    label: 'Error',
    mark: '✕',
    background: color.error,
    foreground: color.textOnAccent,
    haptic: 'error',
    autoClose: false,
  },
};

export interface LastScan {
  code: string;
  at: number;
}

/** ¿Ignorar este escaneo por repetido? Mismo código dentro de la ventana. */
export function shouldIgnoreScan(code: string, last: LastScan | null, now: number): boolean {
  if (!last || last.code !== code) return false;
  return now - last.at < RESCAN_WINDOW_MS;
}
```

- [ ] **Step 4: Correr los tests para verificar que pasan**

```bash
pnpm --filter @urnight/validator test
```

Esperado: PASS, 30 tests en total (20 de sesión + 10 de escaneo).

- [ ] **Step 5: Verificar tipos y lint**

```bash
pnpm --filter @urnight/validator typecheck
pnpm --filter @urnight/validator lint
```

- [ ] **Step 6: Commit**

```bash
git add apps/validator/lib/scan-rules.ts apps/validator/lib/scan-rules.spec.ts
git commit -m "test(validator): reglas puras del veredicto y del dedupe de escaneo

Saca de la pantalla dos decisiones que dejaron de ser detalle de estilos
al aparecer el auto-cierre: qué veredicto se cierra solo y durante cuánto
tiempo se ignora un QR ya leído.

La ventana de dedupe evita que la cámara revalide al instante el mismo
código que acaba de aprobar, que devolvería already_used y, sin red,
metería un pendiente falso en la cola.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 8: Veredicto a pantalla completa con háptica

**Files:**
- Modify: `apps/validator/app/scan.tsx` (reescritura)
- Modify: `apps/validator/package.json` (dependencia `expo-haptics`)

**Interfaces:**
- Consumes de la Tarea 3: `useAuth()` con `getAccessToken`, `refreshAccessToken`, `signOut`.
- Consumes de la Tarea 7: `VERDICT_AUTOCLOSE_MS`, `VERDICT_STYLES`, `shouldIgnoreScan`, `Verdict`, `LastScan`.
- Consumes de la Tarea 4: tokens del DS, `Button`.
- Produces: nada que consuman otras tareas.

- [ ] **Step 1: Instalar `expo-haptics`**

`expo install` elige la versión compatible con el SDK instalado; no fijar una a mano:

```bash
pnpm --filter @urnight/validator exec expo install expo-haptics
```

Verificar que `apps/validator/package.json` ganó la entrada en `dependencies`.

- [ ] **Step 2: Reescribir `app/scan.tsx`**

Reemplazar **todo** el contenido de `apps/validator/app/scan.tsx`:

```tsx
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../components/ui';
import { ApiError, NetworkError, validateQr } from '../lib/api-client';
import { useAuth } from '../lib/auth-context';
import { createLogger } from '../lib/logger';
import { queueCheckin } from '../lib/offline-cache';
import {
  shouldIgnoreScan,
  VERDICT_AUTOCLOSE_MS,
  VERDICT_STYLES,
  type LastScan,
  type Verdict,
} from '../lib/scan-rules';
import { color, radius, space, type } from '../lib/theme';

const log = createLogger('scan');

const HAPTIC: Record<'success' | 'warning' | 'error', Haptics.NotificationFeedbackType> = {
  success: Haptics.NotificationFeedbackType.Success,
  warning: Haptics.NotificationFeedbackType.Warning,
  error: Haptics.NotificationFeedbackType.Error,
};

interface ScanOutcome {
  verdict: Verdict;
  message: string;
  /** Últimos 4 del código, para que el validador pueda referirse al ticket. */
  ref: string;
}

/**
 * Escaneo de QR en puerta (§5). Online-first: valida contra la API y muestra el
 * veredicto a pantalla completa; sólo ante fallo de RED encola offline para
 * sincronizar al recuperar conexión. El contenido del QR nunca se pinta entero
 * ni se loguea (§6).
 */
export default function ScanScreen() {
  const { getAccessToken, refreshAccessToken, signOut } = useAuth();
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [busy, setBusy] = useState(false);
  const [outcome, setOutcome] = useState<ScanOutcome | null>(null);
  const lastScan = useRef<LastScan | null>(null);
  const progress = useRef(new Animated.Value(1)).current;

  const reset = useCallback(() => {
    setOutcome(null);
  }, []);

  // Háptica al aparecer el veredicto, y auto-cierre solo si toca (§3.5).
  useEffect(() => {
    if (!outcome) return;
    const style = VERDICT_STYLES[outcome.verdict];
    void Haptics.notificationAsync(HAPTIC[style.haptic]);
    if (!style.autoClose) return;
    progress.setValue(1);
    Animated.timing(progress, {
      toValue: 0,
      duration: VERDICT_AUTOCLOSE_MS,
      useNativeDriver: true,
    }).start();
    const timer = setTimeout(reset, VERDICT_AUTOCLOSE_MS);
    return () => clearTimeout(timer);
  }, [outcome, progress, reset]);

  async function queueOffline(code: string, scannedAt: string) {
    await queueCheckin(code, scannedAt).catch((e) =>
      log.error({ err: (e as Error).message }, 'validator.checkin.queue_failed'),
    );
    setOutcome({
      verdict: 'offline',
      message: 'Sin conexión. Se sincronizará al recuperar red.',
      ref: code.slice(-4),
    });
  }

  async function handleScan(data: string) {
    const now = Date.now();
    if (busy || shouldIgnoreScan(data, lastScan.current, now)) return;
    setBusy(true);
    lastScan.current = { code: data, at: now };
    // Solo metadatos: el contenido del QR nunca se loguea (§6).
    log.info({ length: data.length }, 'validator.qr.scanned');
    const scannedAt = new Date().toISOString();
    const ref = data.slice(-4);
    try {
      const token = await getAccessToken();
      if (!token) {
        // O no hubo red para renovar —y la puerta sigue operando encolando— o la
        // sesión murió, en cuyo caso el gate de _layout ya lleva a login.
        await queueOffline(data, scannedAt);
        return;
      }
      const res = await validateQr(data, token);
      log.info({ result: res.result }, 'validator.qr.validated');
      setOutcome({ verdict: res.result, message: res.message, ref });
    } catch (err) {
      if (err instanceof NetworkError) {
        await queueOffline(data, scannedAt);
      } else if (err instanceof ApiError && err.status === 401) {
        // El servidor rechazó un access que no había expirado (revocado):
        // renovar a la fuerza y reintentar UNA vez.
        log.warn({}, 'validator.qr.unauthorized');
        const fresh = await refreshAccessToken();
        if (!fresh) {
          await queueOffline(data, scannedAt);
          return;
        }
        try {
          const res = await validateQr(data, fresh);
          log.info({ result: res.result }, 'validator.qr.validated');
          setOutcome({ verdict: res.result, message: res.message, ref });
        } catch (retryErr) {
          if (retryErr instanceof NetworkError) {
            await queueOffline(data, scannedAt);
          } else {
            log.warn({}, 'validator.qr.session_dead');
            await signOut();
            router.replace('/login');
          }
        }
      } else {
        log.error({ err: (err as Error).message }, 'validator.qr.validate_failed');
        setOutcome({
          verdict: 'error',
          message: 'No se pudo validar. Inténtalo de nuevo.',
          ref,
        });
      }
    } finally {
      setBusy(false);
    }
  }

  if (!permission) {
    return <View style={styles.center} />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.permissionText}>Se necesita permiso de cámara para escanear.</Text>
        <Button label="Permitir cámara" onPress={() => void requestPermission()} />
      </SafeAreaView>
    );
  }

  if (outcome) {
    const style = VERDICT_STYLES[outcome.verdict];
    return (
      <SafeAreaView style={[styles.verdict, { backgroundColor: style.background }]}>
        <Text style={[styles.mark, { color: style.foreground }]}>{style.mark}</Text>
        <Text style={[styles.verdictLabel, { color: style.foreground }]}>{style.label}</Text>
        <Text style={[styles.verdictMessage, { color: style.foreground }]}>{outcome.message}</Text>
        <Text style={[styles.verdictRef, { color: style.foreground }]}>Ref ····{outcome.ref}</Text>
        {style.autoClose ? (
          <View style={styles.progressTrack}>
            <Animated.View
              style={[
                styles.progressBar,
                { backgroundColor: style.foreground, transform: [{ scaleX: progress }] },
              ]}
            />
          </View>
        ) : (
          <Button
            label="Escanear otro"
            variant="secondary"
            onPress={reset}
            disabled={busy}
            style={styles.verdictAction}
          />
        )}
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={({ data }) => void handleScan(data)}
      />
      <View style={styles.hintBar} pointerEvents="none">
        <Text style={styles.hint}>{busy ? 'Validando…' : 'Apunta a un QR…'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: color.bgRoot,
  },
  camera: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.s4,
    padding: space.s6,
    backgroundColor: color.bgRoot,
  },
  permissionText: {
    ...type.body,
    color: color.textSecondary,
    textAlign: 'center',
  },
  hintBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingVertical: space.s6,
    backgroundColor: color.bgRoot,
  },
  hint: {
    ...type.title,
    color: color.textSecondary,
    textAlign: 'center',
  },
  verdict: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.s6,
    gap: space.s2,
  },
  mark: {
    fontSize: 96,
    lineHeight: 104,
    fontWeight: '800',
  },
  verdictLabel: {
    ...type.h1,
    textAlign: 'center',
  },
  verdictMessage: {
    ...type.body,
    textAlign: 'center',
    opacity: 0.9,
  },
  verdictRef: {
    ...type.caption,
    opacity: 0.75,
    marginTop: space.s2,
  },
  verdictAction: {
    marginTop: space.s8,
  },
  progressTrack: {
    marginTop: space.s8,
    height: 4,
    width: '60%',
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  progressBar: {
    height: 4,
    width: '100%',
    borderRadius: radius.pill,
    // Sin esto la barra encoge desde el centro y no se lee como cuenta atrás.
    transformOrigin: 'left',
  },
});
```

- [ ] **Step 3: Verificar**

```bash
pnpm --filter @urnight/validator typecheck
pnpm --filter @urnight/validator lint
pnpm --filter @urnight/validator test
```

Esperado: todo limpio, 30 tests en verde.

- [ ] **Step 4: Verificar que la dependencia nativa resuelve en Metro**

```bash
pnpm --filter @urnight/validator exec expo export --platform android
```

Esperado: termina sin error y reporta el bundle. Es el control que atrapó los problemas de resolución de `qrcode` y `react-native-svg` en `apps/mobile`.

- [ ] **Step 5: Commit**

```bash
git add apps/validator/app/scan.tsx apps/validator/package.json pnpm-lock.yaml
git commit -m "feat(validator): veredicto a pantalla completa con háptica y auto-cierre

En puerta se escanea a oscuras, con una mano y con cola detrás: el banner
inferior se leía mal de lejos. El veredicto pasa a ocupar la pantalla
entera sobre color semántico del DS.

Un acceso permitido vibra una vez y se cierra solo a los 1500 ms para que
la cola siga. Los rechazos vibran doble y exigen toque, porque obligan a
actuar; el aviso de encolado offline también, porque es un pendiente y no
un adelante.

La ficha muestra solo lo que la API devuelve de verdad: veredicto,
mensaje y los últimos 4 del código. attendeeName llega siempre null.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 9: Sincronizar diagramas y verificación final

**Files:**
- Modify: `docs/diagramas-secuencia/05-entradas-validacion.md` (SD-10 fase 3, SD-11 fases 1 y 3, tabla de trazabilidad)
- Modify: `docs/diagramas-secuencia/90-canales-moviles.md` (§2.3, §9-4, §9-5)

**Interfaces:**
- Consumes: el comportamiento implementado en las Tareas 3 y 8.
- Produces: nada de código.

**REQUIRED SUB-SKILL:** usar la skill `sincronizar-diagramas-secuencia` del proyecto. Reglas duras de la serie: los nombres se copian tal cual del código (un `grep` debe encontrarlos), no se usan `;` dentro de mensajes ni notas, los placeholders van entre llaves (`{eventoId}`, nunca `<eventoId>`), y los saltos de línea en notas son `<br/>`.

- [ ] **Step 1: Actualizar SD-11 — rama de 401 de la fase 1**

En `docs/diagramas-secuencia/05-entradas-validacion.md`, dentro del diagrama SD-11, sustituir la rama:

```
    else 401 token inválido o expirado
        EDGE-->>API: 401
        API-->>APP: ApiError 401
        APP->>CTX: signOut()
        APP-->>V: vuelta a la pantalla de login
```

por:

```
    else 401 el servidor rechaza el access
        EDGE-->>API: 401
        API-->>APP: ApiError 401
        APP->>CTX: refreshAccessToken()
        alt la renovación devuelve un access nuevo
            CTX-->>APP: access rotado
            APP->>EDGE: reintento único de POST /api/v1/validations/scan
            EDGE-->>APP: 200 OK · veredicto
        else la renovación falla por red
            CTX-->>APP: null
            APP->>SQL: INSERT OR IGNORE INTO pending_checkin
            APP-->>V: aviso ámbar de guardado offline
        else el servidor rechaza el refresh con 401 o 400
            CTX->>CTX: signOut()
            APP-->>V: vuelta a la pantalla de login
        end
```

- [ ] **Step 2: Actualizar SD-11 — nota de la fase 3**

En el mismo diagrama, añadir tras la nota que cierra la fase 3 (`scanned_at se guarda localmente pero NO viaja…`) una nota nueva:

```
    note over CTX, EDGE: El par de tokens se renueva con mutex single-flight. Un fallo de RED al<br/>renovar NO cierra la sesión: la puerta sigue escaneando y encolando mientras<br/>el refresh siga vigente. Solo un 401 o 400 del servidor la mata.
```

- [ ] **Step 3: Actualizar SD-10 — último paso de la fase 3**

En el diagrama SD-10, sustituir:

```
    APP-->>V: banner verde para valid, rojo para el resto
```

por:

```
    APP-->>V: veredicto a pantalla completa, verde para valid y rojo para el resto
    note over APP, V: valid vibra una vez y se cierra solo a los 1500 ms. Los rechazos vibran<br/>doble y esperan toque. Un mismo QR se ignora durante 5000 ms tras leerlo.
```

- [ ] **Step 4: Actualizar la tabla de trazabilidad**

En la sección `## 10. Trazabilidad`, sustituir la fila:

```
| Cola offline | — (local en el dispositivo) | `offline-cache.ts`, `AuthProvider.runSync` | ⚠️ Funciona, pero pierde la hora real del escaneo |
```

por estas dos:

```
| Cola offline | — (local en el dispositivo) | `offline-cache.ts`, `AuthProvider.runSync` | ⚠️ Funciona, pero pierde la hora real del escaneo y no tiene techo |
| Sesión del validador | `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout` | `session-rules.ts`, `AuthProvider.refreshAccessToken` | ✅ Par de tokens con renovación single-flight |
```

- [ ] **Step 5: Actualizar la brecha 4 de la sección 11**

En `## 11. Brechas y riesgos detectados al levantar los flujos`, sustituir el punto 4:

```
4. **El check-in offline pierde su hora real.** `scannedAt` se persiste en SQLite pero no viaja:
   `ValidateQrDto` no lo acepta. Un lote sincronizado a las 3 a.m. queda registrado con esa hora, no
   con la del escaneo en puerta. Afecta a cualquier informe de aforo por franja.
```

por:

```
4. **El check-in offline pierde su hora real.** `scannedAt` se persiste en SQLite pero no llega a
   registrarse. `validateQrSchema` **sí** lo acepta hoy, pero `ValidateQrUseCase` lo ignora: no hay
   ninguna referencia a `scannedAt` en `apps/api/src/modules`. Un lote sincronizado a las 3 a.m. queda
   registrado con esa hora, no con la del escaneo en puerta. Afecta a cualquier informe de aforo por
   franja.
```

- [ ] **Step 6: Actualizar `90-canales-moviles.md` §2.3**

En la tabla de `### 2.3 Qué ya está resuelto en la app hermana`, sustituir la última fila:

```
| Renovación del token | ❌ **tampoco lo hace el validador** — ver §9 | ✅ *single-flight* con rotación (SD-03) |
```

por:

```
| Renovación del token | ✅ *single-flight* con rotación y `AppState` (`lib/session-rules.ts`) | ✅ *single-flight* con rotación (SD-03) |
```

- [ ] **Step 7: Actualizar las brechas 4 y 5 de `90-canales-moviles.md`**

Sustituir el punto 4 de `## 9. Brechas y riesgos`:

```
4. **El validador descarta el refresh token.** `AuthProvider` guarda solo `tokens.accessToken` en
   `SecureStore` y, ante un 401, cierra sesión y manda a login. En una noche de puerta eso significa
   re-loguear a mitad de turno. **El canal del asistente no debe copiar ese patrón**: debe guardar el
   par completo y renovar.
```

por:

```
4. ~~**El validador descarta el refresh token.**~~ **Cerrada.** `apps/validator` guarda el par completo
   y renueva con *single-flight*, y un fallo de red al renovar ya no expulsa: la puerta sigue
   escaneando y encolando mientras el refresh siga vigente.
```

Y en el punto 5, sustituir la frase final:

```
   asistente ya implementa la mitigación completa (single-flight `refreshInFlight` + renovación
   anticipada con `AppState`, SD-03); el validador sigue sin renovar ningún token.
```

por:

```
   asistente ya implementa la mitigación completa (single-flight `refreshInFlight` + renovación
   anticipada con `AppState`, SD-03), y el validador implementa ahora la misma.
```

- [ ] **Step 8: Validar que los diagramas compilan**

Fase 1, obligatoria:

```bash
bash .claude/skills/sincronizar-diagramas-secuencia/scripts/check-diagramas.sh \
  --solo-sintaxis docs/diagramas-secuencia/05-entradas-validacion.md
```

Fase 2, render real (necesita red):

```bash
bash .claude/skills/sincronizar-diagramas-secuencia/scripts/check-diagramas.sh \
  docs/diagramas-secuencia/05-entradas-validacion.md
```

Códigos de salida: `0` bien · `1` sintaxis · `2` render · `3` uso incorrecto. Si la fase 2 no se puede ejecutar por falta de red, decirlo explícitamente al reportar en vez de darla por hecha.

- [ ] **Step 9: Verificación final de todo el paquete**

```bash
pnpm --filter @urnight/validator typecheck
pnpm --filter @urnight/validator lint
pnpm --filter @urnight/validator test
pnpm --filter @urnight/validator exec expo export --platform android
```

Esperado: typecheck y lint sin errores, 30 tests en verde, bundle generado.

- [ ] **Step 10: Commit**

```bash
git add docs/diagramas-secuencia/05-entradas-validacion.md docs/diagramas-secuencia/90-canales-moviles.md
git commit -m "docs(diagramas): sesión renovable del validador y veredicto a pantalla completa

SD-11 cambia su rama de 401: antes cerraba sesión directo, ahora renueva
y reintenta una vez, y solo un rechazo del refresh manda a login. SD-10
cambia el paso final del banner.

Cierra la brecha 4 de 90-canales-moviles y corrige la 4 de
05-entradas-validacion: validateQrSchema sí acepta scannedAt, es
ValidateQrUseCase quien lo ignora.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

- [ ] **Step 11: Checklist en dispositivo**

No automatizable. Requiere un dispositivo con la API corriendo y una cuenta con rol `validator`. Ejecutar y reportar resultado de cada punto sin darlo por bueno de antemano:

1. Login con cuenta **sin** rol `validator` → "Esta cuenta no tiene permisos de validador."
2. Login correcto → panel de turno con chip "En línea" y contador en 0.
3. Escaneo de una entrada válida → vibración simple, pantalla verde, cierre solo a ~1,5 s.
4. Volver a apuntar al mismo QR de inmediato → **no** se revalida.
5. Esperar 5 s y volver a apuntar al mismo QR → devuelve `already_used`, pantalla roja, espera toque.
6. Modo avión → escaneo → pantalla ámbar y contador de pendientes en 1.
7. Desactivar modo avión → la cola se sincroniza sola y el contador baja a 0.
8. Con el access expirado y sin red, escanear → sigue encolando, **no** manda a login.
9. Cerrar sesión → vuelve a login. Reabrir la app → sigue en login.

---

## Self-Review

**Cobertura del spec:**

| Sección del spec | Tarea |
|---|---|
| §2.1 contrato de `useAuth()` | 3 (+ `refreshAccessToken`, refinamiento documentado arriba) |
| §2.2 `auth.ts` par de tokens | 3 |
| §2.3 `api-client.ts` | 2 |
| §2.4 `auth-context.tsx` | 3 |
| §2.5 política offline | 1 (`refreshFailureAction`, `sessionActionFor`) + 3 (cableado) |
| §2.6 cambio en `scan.tsx` | 3 (sesión) + 8 (presentación) |
| §2.7 lo que no cambia | ninguna tarea toca `offline-cache.ts` ni el nombre del fichero SQLite |
| §3.1 módulos nuevos | 4 |
| §3.2 `_layout.tsx` | 5 |
| §3.3 `login.tsx` | 5 |
| §3.4 `index.tsx` | 6 |
| §3.5 veredicto | 7 (reglas) + 8 (pantalla) |
| §3.6 dedupe | 7 (`shouldIgnoreScan`) + 8 (`lastScan`) |
| §3.7 dependencias | 1 (`vitest`) + 8 (`expo-haptics`) |
| §4.1 `session-rules.ts` | 1 |
| §4.2 `scan-rules.ts` | 7 |
| §4.3 verificación por tramo | cierre de cada tarea + 9 |
| §4.4 dispositivo | 9, step 11 |
| §5 riesgos | asumidos; ninguno requiere tarea |
| §6 documentación | 9 |

**Consistencia de tipos:** `sessionActionFor` devuelve `'use' | 'refresh' | 'dead'` en la Tarea 1 y se consume con esos tres valores en la Tarea 3. `refreshFailureAction` devuelve `'offline' | 'dead'` y en la Tarea 3 solo se compara contra `'dead'`. `Verdict` de la Tarea 7 incluye los cuatro valores de `qrValidationResponseSchema.result` más `offline` y `error`, que es exactamente lo que `ScanOutcome` asigna en la Tarea 8. `VerdictStyle.haptic` usa `'success' | 'warning' | 'error'` y el mapa `HAPTIC` de la Tarea 8 cubre las tres claves.

**Sin placeholders:** cada paso lleva el código o el comando exacto. Las dos tareas sin test unitario (2 y 3) explican por qué y contra qué se verifican, en vez de dejarlo implícito.
