import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from '../lib/auth-context';

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

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="auto" />
      <AuthGate />
    </AuthProvider>
  );
}
