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
  loginRequest,
  logoutRequest,
  refreshRequest,
  setTokenProvider,
} from './api-client';
import {
  claimsOf,
  clearTokens,
  getStoredTokens,
  isTokenFresh,
  storeTokens,
  type AccessClaims,
  type TokenPair,
} from './auth';
import { createLogger } from './logger';

const log = createLogger('auth-context');

type SessionStatus = 'restoring' | 'guest' | 'authenticated';

interface AuthState {
  /** `restoring` mientras se rehidrata desde SecureStore al arrancar (SD-02). */
  status: SessionStatus;
  /** Claims del access token para UX (email, roles); la firma la valida la API. */
  claims: AccessClaims | null;
  signIn(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
  /**
   * Access token vigente, renovando con single-flight si expiró (SD-03).
   * `null` si no hay sesión o la renovación falló por red.
   */
  getAccessToken(): Promise<string | null>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<SessionStatus>('restoring');
  const [claims, setClaims] = useState<AccessClaims | null>(null);
  const tokensRef = useRef<TokenPair | null>(null);
  // Mutex single-flight: el refresh es de un solo uso y su reutilización revoca
  // TODAS las sesiones del usuario (SD-03), así que jamás dos refresh en paralelo.
  const refreshInFlight = useRef<Promise<string | null> | null>(null);

  const applySession = useCallback((tokens: TokenPair | null) => {
    tokensRef.current = tokens;
    setClaims(tokens ? claimsOf(tokens.accessToken) : null);
    setStatus(tokens ? 'authenticated' : 'guest');
  }, []);

  // Rehidratar sesión al arrancar (SD-02): con refresh vigente hay sesión aunque
  // el access haya expirado — se renovará on-demand.
  useEffect(() => {
    getStoredTokens().then((stored) => {
      if (stored && isTokenFresh(stored.refreshToken, 0)) {
        applySession(stored);
      } else {
        if (stored) void clearTokens();
        applySession(null);
      }
    });
  }, [applySession]);

  const refreshSingleFlight = useCallback((): Promise<string | null> => {
    if (refreshInFlight.current) return refreshInFlight.current;
    const run = (async (): Promise<string | null> => {
      const current = tokensRef.current;
      if (!current) return null;
      try {
        const rotated = await refreshRequest(current.refreshToken);
        await storeTokens(rotated);
        applySession(rotated);
        log.info({}, 'mobile.auth.refreshed');
        return rotated.accessToken;
      } catch (err) {
        if (err instanceof ApiError && (err.status === 401 || err.status === 400)) {
          // Refresh inválido/revocado: la sesión murió, volver a invitado (SD-07).
          log.warn({ code: err.code }, 'mobile.auth.refresh_rejected');
          await clearTokens();
          applySession(null);
        } else {
          log.warn({ err: (err as Error).message }, 'mobile.auth.refresh_failed');
        }
        return null;
      }
    })();
    refreshInFlight.current = run.finally(() => {
      refreshInFlight.current = null;
    });
    return refreshInFlight.current;
  }, [applySession]);

  const getAccessToken = useCallback(async (): Promise<string | null> => {
    const current = tokensRef.current;
    if (!current) return null;
    if (isTokenFresh(current.accessToken)) return current.accessToken;
    return refreshSingleFlight();
  }, [refreshSingleFlight]);

  // El cliente HTTP obtiene el token de aquí, sin importar este módulo (evita
  // el ciclo de dependencias). Se limpia al desmontar.
  useEffect(() => {
    setTokenProvider(getAccessToken);
    return () => setTokenProvider(null);
  }, [getAccessToken]);

  // Refresh proactivo al volver a primer plano en vez de esperar un 401 (SD-03).
  useEffect(() => {
    if (status !== 'authenticated') return;
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && tokensRef.current && !isTokenFresh(tokensRef.current.accessToken)) {
        void refreshSingleFlight();
      }
    });
    return () => sub.remove();
  }, [status, refreshSingleFlight]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const tokens = await loginRequest({ email, password });
      await storeTokens(tokens);
      applySession(tokens);
      log.info({}, 'mobile.auth.signed_in');
    },
    [applySession],
  );

  const signOut = useCallback(async () => {
    const current = tokensRef.current;
    // El móvil SÍ revoca el refresh en servidor (§90 SD-02; gap conocido de la web).
    if (current) {
      try {
        await logoutRequest(current.refreshToken);
      } catch (err) {
        log.warn({ err: (err as Error).message }, 'mobile.auth.logout_server_failed');
      }
    }
    await clearTokens();
    applySession(null);
    log.info({}, 'mobile.auth.signed_out');
  }, [applySession]);

  return (
    <AuthContext.Provider value={{ status, claims, signIn, signOut, getAccessToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
