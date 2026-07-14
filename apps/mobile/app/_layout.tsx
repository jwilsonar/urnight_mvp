import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { SessionProvider } from '../lib/session';
import { colors } from '../lib/theme';

/**
 * Layout raíz: stack dark-first (tokens de lib/theme.ts) + sesión demo.
 * Sin sesión, el gate de app/(tabs)/_layout.tsx redirige a /login (la app no
 * tiene modo invitado). El detalle de evento y los flujos (canje, checkout,
 * reserva, subpantallas de perfil) usan header nativo con back.
 */
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <SessionProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.bgRoot },
            headerTintColor: colors.textPrimary,
            headerTitleStyle: { fontWeight: '800' },
            contentStyle: { backgroundColor: colors.bgRoot },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="registro" options={{ title: 'Crear cuenta', headerBackTitle: 'Atrás' }} />
          <Stack.Screen name="evento/[id]" options={{ title: 'Evento', headerBackTitle: 'Atrás' }} />
          <Stack.Screen name="local/[slug]" options={{ title: 'Local', headerBackTitle: 'Atrás' }} />
          <Stack.Screen name="canje/[eventoId]" options={{ title: 'Canjear entrada', headerBackTitle: 'Atrás' }} />
          <Stack.Screen name="checkout/[eventoId]" options={{ title: 'Comprar entradas', headerBackTitle: 'Atrás' }} />
          <Stack.Screen name="reserva" options={{ title: 'Reservar mesa', headerBackTitle: 'Atrás' }} />
          <Stack.Screen name="perfil/wallet" options={{ title: 'Wallet UrNight', headerBackTitle: 'Atrás' }} />
          <Stack.Screen name="perfil/niveles" options={{ title: 'Niveles y badges', headerBackTitle: 'Atrás' }} />
          <Stack.Screen name="perfil/referidos" options={{ title: 'Referidos', headerBackTitle: 'Atrás' }} />
          <Stack.Screen name="perfil/guardados" options={{ title: 'Guardados', headerBackTitle: 'Atrás' }} />
          <Stack.Screen name="perfil/notificaciones" options={{ title: 'Notificaciones', headerBackTitle: 'Atrás' }} />
        </Stack>
      </SessionProvider>
    </SafeAreaProvider>
  );
}
