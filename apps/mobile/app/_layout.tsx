import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { color } from '../lib/theme';

export default function RootLayout() {
  return (
    <>
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
      </Stack>
    </>
  );
}
