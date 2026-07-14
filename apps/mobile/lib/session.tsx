import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

/**
 * Sesión demo del asistente. La app NO tiene modo invitado: sin sesión, los
 * tabs redirigen a /login (gate en app/(tabs)/_layout.tsx). Con backend real
 * esto se conecta al módulo identity vía api-client + SecureStore (mismo
 * patrón que apps/validator); por ahora cualquier credencial entra.
 */

export interface SessionUser {
  name: string;
  email: string;
}

interface SessionContextValue {
  user: SessionUser | null;
  signIn: (user: SessionUser) => void;
  signOut: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);

  const signIn = useCallback((next: SessionUser) => setUser(next), []);
  const signOut = useCallback(() => setUser(null), []);

  const value = useMemo(() => ({ user, signIn, signOut }), [user, signIn, signOut]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession debe usarse dentro de <SessionProvider>');
  return ctx;
}
