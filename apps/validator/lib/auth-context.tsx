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
