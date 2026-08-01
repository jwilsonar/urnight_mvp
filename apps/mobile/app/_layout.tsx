import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../lib/auth-context';
import { color } from '../lib/theme';

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: color.bgRoot },
          headerStyle: { backgroundColor: color.bgBase },
          headerTintColor: color.textPrimary,
          headerTitleStyle: { color: color.textPrimary },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="evento/[slug]"
          options={{ headerTransparent: true, headerTitle: '' }}
        />
        <Stack.Screen name="entrada/[id]" options={{ title: 'Tu entrada' }} />
        <Stack.Screen
          name="login"
          options={{ presentation: 'modal', headerShown: false }}
        />
      </Stack>
    </AuthProvider>
  );
}
