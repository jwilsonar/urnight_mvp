import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';

/**
 * Estado de conexión (mismo mecanismo que `apps/validator`). Se asume conectado
 * al arrancar: es preferible intentar la petición y fallar a bloquear la pantalla
 * por un estado que aún no llegó.
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

/** Suscripción imperativa, para disparar la reconciliación al recuperar red. */
export function subscribeOnline(cb: (online: boolean) => void): () => void {
  return NetInfo.addEventListener((state) => cb(state.isConnected !== false));
}
