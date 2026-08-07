import NextAuth, { type User } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import type { JWT } from 'next-auth/jwt';
import { z } from 'zod';
import {
  DEFAULT_SESSION_IDLE_TIMEOUT_MINUTES,
  MAX_SESSION_IDLE_TIMEOUT_MINUTES,
  MIN_SESSION_IDLE_TIMEOUT_MINUTES,
  SESSION_IDLE_TIMEOUT_SETTING_KEY,
  type AuthTokensResponse,
  type UserProfileResponse,
} from '@urnight/contracts';
import { fetchMe, googleExchange, refreshTokens } from './api/auth/requests';
import { ApiError } from './api/client';
import { getPlatformSetting } from './api/ops';
import { createLogger } from './logger';

const log = createLogger('nextauth');

/**
 * Auth.js (NextAuth v5) — la sesión es portadora del JWT propio del backend.
 *
 * - Email/contraseña: el Server Action (`auth-actions.ts`) obtiene los tokens
 *   del backend y los entrega a `Credentials` vía `handoff` (server→server, los
 *   tokens nunca tocan el cliente). `authorize` re-verifica contra `/auth/me`,
 *   por lo que un handoff falsificado no puede crear sesión.
 * - Google: el `id_token` de OIDC se canjea en `/auth/google` dentro de `jwt()`.
 * - Refresh: el callback `jwt()` renueva el access token con el refresh token.
 */

const SKEW_SECONDS = 30;
const SESSION_UPDATE_AGE_SECONDS = 60;
const IDLE_SETTING_CACHE_TTL_MS = 60_000;
const IDLE_SETTING_FETCH_TIMEOUT_MS = 2_000;
const nowSeconds = (): number => Math.floor(Date.now() / 1000);

type ActivityJwt = JWT & { lastActivityAt?: number };
/**
 * Payload de `update()` desde el cliente. Siempre hay que mandar alguno: sin
 * argumentos, NextAuth v5 no ejecuta el callback jwt con trigger 'update' y el
 * snapshot de perfil se queda viejo.
 */
type SessionUpdate = {
  activity?: boolean;
  forceTokenRefresh?: boolean;
  refreshProfile?: boolean;
};

let idleTimeoutCache: { minutes: number; expiresAt: number } | undefined;
let idleTimeoutRequest: Promise<number> | undefined;
const refreshFlights = new Map<string, Promise<AuthTokensResponse>>();

const handoffSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  expiresIn: z.number().int().positive(),
});

/** User interno con tokens + perfil; nunca se serializa al cliente. */
interface AuthUser extends User {
  tokens: AuthTokensResponse;
  profile: UserProfileResponse;
}

function isAuthUser(user: unknown): user is AuthUser {
  return typeof user === 'object' && user !== null && 'tokens' in user && 'profile' in user;
}

/** El access token todavía sirve para llamar al backend (con margen de reloj). */
function isAccessTokenFresh(token: JWT): boolean {
  return Boolean(
    token.accessToken &&
      token.accessTokenExpires &&
      nowSeconds() < token.accessTokenExpires - SKEW_SECONDS,
  );
}

/**
 * Google solo se registra si hay credenciales: un provider OAuth con clientId/
 * secret vacíos es configuración inválida y ensucia el flujo de sign-in.
 */
const googleEnabled = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);

export const { handlers, auth, signIn, signOut } = NextAuth(async () => {
  const idleTimeoutSeconds = (await resolveIdleTimeoutMinutes()) * 60;
  return {
    trustHost: true,
    session: {
      strategy: 'jwt',
      maxAge: idleTimeoutSeconds,
      updateAge: SESSION_UPDATE_AGE_SECONDS,
    },
    pages: { signIn: '/login' },
    providers: [
      ...(googleEnabled ? [Google] : []),
      Credentials({
        id: 'credentials',
        // El handoff lo produce SOLO nuestro Server Action (server-side).
        credentials: { handoff: {} },
        authorize: async (raw) => {
          const parsed = handoffSchema.safeParse(safeJson(raw?.handoff));
          if (!parsed.success) return null;

          // Re-verifica el access token contra el backend: si es inválido no hay
          // sesión, y el perfil/roles son los autoritativos del backend.
          const profile = await fetchMe(parsed.data.accessToken).catch(() => null);
          if (!profile) {
            log.warn({}, 'web.auth.credentials.unresolved');
            return null;
          }

          return {
            id: profile.id,
            name: profile.fullName,
            email: profile.email,
            image: profile.avatarUrl,
            tokens: {
              accessToken: parsed.data.accessToken,
              refreshToken: parsed.data.refreshToken,
              tokenType: 'Bearer',
              expiresIn: parsed.data.expiresIn,
            },
            profile,
          } satisfies AuthUser;
        },
      }),
    ],
    callbacks: {
      async jwt({ token, user, account, trigger, session }) {
        // Sign-in con Google: canjear el id_token por el JWT del backend.
        if (account?.provider === 'google' && account.id_token) {
          const outcome = await googleExchange(account.id_token);
          // Google con MFA activo tampoco emite tokens: sin pantalla de desafío
          // en este flujo, se corta la sesión en vez de dejarla a medias.
          if (outcome.kind === 'mfa_challenge') {
            throw new Error('MfaChallengeRequired');
          }
          return markActivity(await hydrate(token, outcome.result));
        }

        // Sign-in con credenciales: el user ya trae tokens + perfil verificados.
        if (isAuthUser(user)) {
          token.profile = user.profile;
          token.roles = user.profile.roles;
          return markActivity(setTokens(token, user.tokens));
        }

        const activityToken = token as ActivityJwt;
        if (isIdle(activityToken, idleTimeoutSeconds)) {
          log.info({ userId: token.profile?.id }, 'web.auth.session.idle_expired');
          return expireSession(activityToken);
        }
        markActivity(activityToken);

        // `update()` re-sincroniza perfil/roles. El enrolamiento MFA además
        // fuerza refresh para reemplazar de inmediato el claim `mfaPending`.
        const sessionUpdate = session as SessionUpdate | undefined;
        const activityOnly = sessionUpdate?.activity === true;
        if (
          trigger === 'update' &&
          sessionUpdate?.forceTokenRefresh === true
        ) {
          const refreshed = await refreshAccess(token);
          if (!refreshed.error && refreshed.accessToken) {
            const profile = await fetchMe(refreshed.accessToken).catch(() => null);
            if (profile) {
              refreshed.profile = profile;
              refreshed.roles = profile.roles;
            }
          }
          return refreshed;
        }
        if (trigger === 'update' && !activityOnly) {
          // El perfil se re-consulta SIEMPRE con un token vigente. Antes se
          // llamaba a fetchMe con el token que hubiera: si estaba vencido, la
          // API devolvía 401, el `.catch` se lo tragaba en silencio y el
          // snapshot quedaba viejo. Como `onboardingCompleted` sale de ese
          // snapshot, /onboarding guardaba bien en el backend pero seguía
          // rebotando con el valor antiguo: el bucle del que no se salía.
          const fresh = isAccessTokenFresh(token) ? token : await refreshAccess(token);
          if (fresh.error || !fresh.accessToken) return fresh;
          const profile = await fetchMe(fresh.accessToken).catch(() => null);
          if (profile) {
            fresh.profile = profile;
            fresh.roles = profile.roles;
          } else {
            log.warn({ userId: token.profile?.id }, 'web.auth.session.profile_refresh_failed');
          }
          return fresh;
        }

        // Token vigente.
        if (isAccessTokenFresh(token)) return token;

        // Expirado: renovar.
        return refreshAccess(token);
      },
      async session({ session, token }) {
        // Nunca entregar al browser un access token que se sabe vencido o
        // irrenovable: con `error` presente el cliente debe re-autenticar
        // (SessionExpiryWatcher en providers.tsx fuerza el re-login).
        session.accessToken = token.error ? undefined : token.accessToken;
        session.error = token.error;
        // Scope multi-tenant: se decodifica del access token vigente en cada
        // resolución (cubre también sesiones ya emitidas antes de este cambio).
        const scope = session.accessToken
          ? decodeScope(session.accessToken)
          : { companyId: null, localId: null, mfaPending: false };
        session.user.companyId = scope.companyId;
        session.user.localId = scope.localId;
        session.user.mfaPending = scope.mfaPending;
        if (token.profile) {
          session.user.id = token.profile.id;
          session.user.name = token.profile.fullName;
          session.user.email = token.profile.email;
          session.user.image = token.profile.avatarUrl ?? undefined;
          session.user.roles = token.profile.roles;
          session.user.onboardingCompleted = token.profile.onboardingCompleted;
        }
        return session;
      },
    },
  };
});

async function resolveIdleTimeoutMinutes(): Promise<number> {
  const now = Date.now();
  if (idleTimeoutCache && idleTimeoutCache.expiresAt > now) return idleTimeoutCache.minutes;
  if (idleTimeoutRequest) return idleTimeoutRequest;

  idleTimeoutRequest = getPlatformSetting(SESSION_IDLE_TIMEOUT_SETTING_KEY, undefined, {
    timeoutMs: IDLE_SETTING_FETCH_TIMEOUT_MS,
  })
    .then((setting) => {
      const minutes = Number(setting.value.trim());
      const valid =
        setting.valueType === 'number' &&
        Number.isInteger(minutes) &&
        minutes >= MIN_SESSION_IDLE_TIMEOUT_MINUTES &&
        minutes <= MAX_SESSION_IDLE_TIMEOUT_MINUTES;
      if (valid) return minutes;
      log.warn({ value: setting.value }, 'web.auth.idle_timeout.invalid_setting');
      return DEFAULT_SESSION_IDLE_TIMEOUT_MINUTES;
    })
    .catch((err: unknown) => {
      log.warn({ status: err instanceof ApiError ? err.status : undefined }, 'web.auth.idle_timeout.defaulted');
      return DEFAULT_SESSION_IDLE_TIMEOUT_MINUTES;
    })
    .then((minutes) => {
      idleTimeoutCache = {
        minutes,
        expiresAt: Date.now() + IDLE_SETTING_CACHE_TTL_MS,
      };
      return minutes;
    });

  void idleTimeoutRequest.then(
    () => {
      idleTimeoutRequest = undefined;
    },
    () => {
      idleTimeoutRequest = undefined;
    },
  );
  return idleTimeoutRequest;
}

function isIdle(token: ActivityJwt, idleTimeoutSeconds: number): boolean {
  return token.lastActivityAt !== undefined && nowSeconds() - token.lastActivityAt >= idleTimeoutSeconds;
}

function markActivity<T extends ActivityJwt>(token: T): T {
  token.lastActivityAt = nowSeconds();
  return token;
}

function expireSession<T extends ActivityJwt>(token: T): T {
  delete token.accessToken;
  delete token.refreshToken;
  delete token.accessTokenExpires;
  token.error = 'RefreshAccessTokenError';
  return token;
}

function refreshSingleFlight(refreshToken: string): Promise<AuthTokensResponse> {
  const existing = refreshFlights.get(refreshToken);
  if (existing) return existing;

  const request = refreshTokens(refreshToken);
  refreshFlights.set(refreshToken, request);
  const cleanup = () => {
    if (refreshFlights.get(refreshToken) === request) refreshFlights.delete(refreshToken);
  };
  void request.then(cleanup, cleanup);
  return request;
}

function safeJson(value: unknown): unknown {
  if (typeof value !== 'string') return undefined;
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

/**
 * Lee scope multi-tenant y `mfaPending` de los claims del access token
 * del backend. No se verifica la firma (el backend la revalida en cada request):
 * solo se extraen los claims para autocompletar formularios con la empresa del
 * actor, de modo que el usuario nunca teclee su propio UUID de empresa.
 */
function decodeScope(accessToken: string): {
  companyId: string | null;
  localId: string | null;
  mfaPending: boolean;
} {
  try {
    const payload = accessToken.split('.')[1];
    if (!payload) return { companyId: null, localId: null, mfaPending: false };
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      companyId?: string | null;
      localId?: string | null;
      mfaPending?: boolean;
    };
    return {
      companyId: claims.companyId ?? null,
      localId: claims.localId ?? null,
      mfaPending: claims.mfaPending === true,
    };
  } catch {
    return { companyId: null, localId: null, mfaPending: false };
  }
}

function setTokens<T extends JWT>(token: T, tokens: AuthTokensResponse): T {
  token.accessToken = tokens.accessToken;
  token.refreshToken = tokens.refreshToken;
  token.accessTokenExpires = nowSeconds() + tokens.expiresIn;
  delete token.error;
  return token;
}

/** Persiste tokens y resuelve el perfil (camino Google, sin user previo). */
async function hydrate<T extends JWT>(token: T, tokens: AuthTokensResponse): Promise<T> {
  setTokens(token, tokens);
  const profile = await fetchMe(tokens.accessToken).catch(() => null);
  if (profile) {
    token.profile = profile;
    token.roles = profile.roles;
  }
  return token;
}

async function refreshAccess<T extends JWT>(token: T): Promise<T> {
  if (!token.refreshToken) {
    log.warn({}, 'web.auth.refresh.no_token');
    token.error = 'RefreshAccessTokenError';
    return token;
  }
  try {
    const refreshed = setTokens(token, await refreshSingleFlight(token.refreshToken));
    log.debug({ userId: token.profile?.id }, 'web.auth.refresh.success');
    return refreshed;
  } catch (err) {
    // 401/403 del backend = refresh token inválido/revocado: sesión irrecuperable,
    // se limpian los tokens para no seguir entregando un Bearer muerto. Errores de
    // red/5xx son transitorios: se conservan los tokens y se reintenta en la
    // siguiente resolución del JWT.
    const unrecoverable = err instanceof ApiError && (err.status === 401 || err.status === 403);
    log.warn({ userId: token.profile?.id, unrecoverable }, 'web.auth.refresh.failed');
    if (unrecoverable) {
      expireSession(token as T & ActivityJwt);
    }
    token.error = 'RefreshAccessTokenError';
    return token;
  }
}
