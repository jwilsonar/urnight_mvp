import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { colors } from '../lib/theme';

/**
 * Layout raíz: stack dark-first (tokens de lib/theme.ts). Los tabs viven en
 * app/(tabs)/ sin header propio; el detalle de evento usa header nativo con
 * back (transición de plataforma = animación de navegación "gratis").
 */
export default function RootLayout() {
  return (
    <SafeAreaProvider>
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
        <Stack.Screen name="evento/[id]" options={{ title: 'Evento', headerBackTitle: 'Atrás' }} />
      </Stack>
    </SafeAreaProvider>
  );
}
