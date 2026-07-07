import NetInfo from '@react-native-community/netinfo';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { login as apiLogin, validateQr } from './api-client';
import { clearToken, getStoredToken, isValidatorToken, NotValidatorError, storeToken } from './auth';
import { createLogger } from './logger';
import { syncPending } from './offline-cache';

const log = createLogger('auth-context');

interface AuthState {
  /** Access token vigente con rol validator, o null si no hay sesión. */
  token: string | null;
  /** false mientras se rehidrata el token desde SecureStore al arrancar. */
  isReady: boolean;
  signIn(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
  /** Fuerza un intento de sincronización de la cola offline (§5). */
  runSync(): Promise<number>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const tokenRef = useRef<string | null>(null);
  tokenRef.current = token;

  // Rehidratar sesión al arrancar.
  useEffect(() => {
    getStoredToken().then((stored) => {
      setToken(isValidatorToken(stored) ? stored : null);
      setIsReady(true);
    });
  }, []);

  const runSync = useCallback(async (): Promise<number> => {
    const t = tokenRef.current;
    if (!t) return 0;
    try {
      return await syncPending((qr) => validateQr(qr, t));
    } catch (err) {
      log.warn({ err: (err as Error).message }, 'validator.sync.run_failed');
      return 0;
    }
  }, []);

  // Sync al recuperar red (§5): intento inicial al montar con sesión + listener
  // NetInfo que dispara al pasar a conectado.
  useEffect(() => {
    if (!token) return;
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
  }, [token, runSync]);

  const signIn = useCallback(async (email: string, password: string) => {
    const tokens = await apiLogin(email, password);
    if (!isValidatorToken(tokens.accessToken)) {
      throw new NotValidatorError();
    }
    await storeToken(tokens.accessToken);
    setToken(tokens.accessToken);
    log.info({}, 'validator.auth.signed_in');
  }, []);

  const signOut = useCallback(async () => {
    await clearToken();
    setToken(null);
    log.info({}, 'validator.auth.signed_out');
  }, []);

  return (
    <AuthContext.Provider value={{ token, isReady, signIn, signOut, runSync }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
