import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from '../lib/auth-context';

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

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="auto" />
      <AuthGate />
    </AuthProvider>
  );
}
