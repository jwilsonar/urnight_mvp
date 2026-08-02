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
