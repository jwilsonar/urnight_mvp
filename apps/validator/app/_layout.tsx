import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from '../lib/auth-context';
import { color } from '../lib/theme';

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

  // El Stack se monta SIEMPRE, incluso rehidratando: expo-router necesita un
  // navegador en la raíz y devolver otra cosa provoca "Attempted to navigate
  // before mounting the Root Layout". El estado de carga lo pinta `index`.
  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: color.bgRoot },
        headerStyle: { backgroundColor: color.bgBase },
        headerTintColor: color.textPrimary,
        headerTitleStyle: { color: color.textPrimary },
        headerTitle: 'Ravenue Validador',
      }}
    >
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="scan" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <AuthGate />
    </AuthProvider>
  );
}
