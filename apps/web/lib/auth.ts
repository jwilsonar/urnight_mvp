import NextAuth, { type User } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import type { JWT } from 'next-auth/jwt';
import { z } from 'zod';
import type { AuthTokensResponse, UserProfileResponse } from '@urnight/contracts';
import { fetchMe, googleExchange, refreshTokens } from './api/auth/requests';
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
const nowSeconds = (): number => Math.floor(Date.now() / 1000);

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

/**
 * Google solo se registra si hay credenciales: un provider OAuth con clientId/
 * secret vacíos es configuración inválida y ensucia el flujo de sign-in.
 */
const googleEnabled = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: 'jwt' },
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
    async jwt({ token, user, account, trigger }) {
      // Sign-in con Google: canjear el id_token por el JWT del backend.
      if (account?.provider === 'google' && account.id_token) {
        return hydrate(token, await googleExchange(account.id_token));
      }

      // Sign-in con credenciales: el user ya trae tokens + perfil verificados.
      if (isAuthUser(user)) {
        token.profile = user.profile;
        token.roles = user.profile.roles;
        return setTokens(token, user.tokens);
      }

      // `update()` desde el cliente (p. ej. tras completar onboarding): re-sincroniza
      // el perfil/roles autoritativos del backend sin esperar al vencimiento.
      if (trigger === 'update' && token.accessToken) {
        const profile = await fetchMe(token.accessToken).catch(() => null);
        if (profile) {
          token.profile = profile;
          token.roles = profile.roles;
        }
        return token;
      }

      // Token vigente.
      if (token.accessTokenExpires && nowSeconds() < token.accessTokenExpires - SKEW_SECONDS) {
        return token;
      }

      // Expirado: renovar.
      return refreshAccess(token);
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.error = token.error;
      // Scope multi-tenant: se decodifica del access token vigente en cada
      // resolución (cubre también sesiones ya emitidas antes de este cambio).
      const scope = token.accessToken
        ? decodeScope(token.accessToken)
        : { companyId: null, localId: null };
      session.user.companyId = scope.companyId;
      session.user.localId = scope.localId;
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
});

function safeJson(value: unknown): unknown {
  if (typeof value !== 'string') return undefined;
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

/**
 * Lee el scope multi-tenant (companyId/localId) de los claims del access token
 * del backend. No se verifica la firma (el backend la revalida en cada request):
 * solo se extraen los claims para autocompletar formularios con la empresa del
 * actor, de modo que el usuario nunca teclee su propio UUID de empresa.
 */
function decodeScope(accessToken: string): { companyId: string | null; localId: string | null } {
  try {
    const payload = accessToken.split('.')[1];
    if (!payload) return { companyId: null, localId: null };
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      companyId?: string | null;
      localId?: string | null;
    };
    return { companyId: claims.companyId ?? null, localId: claims.localId ?? null };
  } catch {
    return { companyId: null, localId: null };
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
async function hydrate<T extends JWT>(
  token: T,
  tokens: AuthTokensResponse,
): Promise<T> {
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
    const refreshed = setTokens(token, await refreshTokens(token.refreshToken));
    log.debug({ userId: token.profile?.id }, 'web.auth.refresh.success');
    return refreshed;
  } catch {
    log.warn({ userId: token.profile?.id }, 'web.auth.refresh.failed');
    token.error = 'RefreshAccessTokenError';
    return token;
  }
}
