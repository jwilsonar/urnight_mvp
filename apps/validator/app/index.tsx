/** Panel de turno de la app de puerta: estado de red, cola pendiente y acceso al escáner. */
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Chip, Eyebrow, LoadingState } from '../components/ui';
import { useAuth } from '../lib/auth-context';
import { useIsOnline } from '../lib/net';
import { countPending } from '../lib/offline-cache';
import { color, radius, space, type } from '../lib/theme';

export default function HomeScreen() {
  const { status, runSync, signOut } = useAuth();
  const router = useRouter();
  const online = useIsOnline();
  const [pending, setPending] = useState(0);
  const [syncing, setSyncing] = useState(false);

  const refresh = useCallback(() => {
    countPending()
      .then(setPending)
      .catch(() => setPending(0));
  }, []);

  // Recontar al enfocar (tras escanear o sincronizar).
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  async function onSync() {
    if (syncing) return;
    setSyncing(true);
    try {
      await runSync();
      refresh();
    } finally {
      setSyncing(false);
    }
  }

  // El Stack raíz se monta siempre, así que el estado de rehidratación se pinta
  // aquí en vez de dejar la pantalla en blanco mientras se lee SecureStore.
  if (status === 'restoring') {
    return (
      <SafeAreaView style={styles.safe}>
        <LoadingState />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Eyebrow>Puerta · Ravenue</Eyebrow>
          <Text style={styles.title}>Validación de puerta</Text>
        </View>

        <Chip
          label={online ? '● En línea' : '● Sin conexión'}
          tone={online ? 'success' : 'warning'}
        />

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Check-ins pendientes</Text>
          <Text style={styles.cardValue}>{pending}</Text>
          {pending > 0 && !online ? (
            <Text style={styles.cardHint}>Se enviarán solos al recuperar la red.</Text>
          ) : null}
        </View>

        <View style={styles.actions}>
          <Button label="Escanear QR" onPress={() => router.push('/scan')} />
          {pending > 0 ? (
            <Button
              label={syncing ? 'Sincronizando…' : 'Sincronizar ahora'}
              variant="secondary"
              // Sin red, pulsarlo solo produciría un fallo silencioso.
              disabled={!online || syncing}
              onPress={() => void onSync()}
            />
          ) : null}
        </View>

        <Pressable accessibilityRole="button" onPress={() => void signOut()} style={styles.signOut}>
          <Text style={styles.signOutText}>Cerrar sesión</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: color.bgRoot,
  },
  scroll: {
    flexGrow: 1,
    padding: space.s6,
    gap: space.s6,
  },
  header: {
    gap: space.s2,
  },
  title: {
    ...type.h1,
    color: color.textPrimary,
  },
  card: {
    backgroundColor: color.bgSurface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: color.borderFaint,
    padding: space.s4,
    gap: space.s1,
  },
  cardLabel: {
    ...type.label,
    color: color.textSecondary,
  },
  cardValue: {
    ...type.display,
    color: color.textPrimary,
  },
  cardHint: {
    ...type.caption,
    color: color.textMuted,
  },
  actions: {
    gap: space.s3,
  },
  signOut: {
    marginTop: 'auto',
    alignSelf: 'center',
    paddingVertical: space.s3,
  },
  signOutText: {
    ...type.bodySm,
    color: color.actionLink,
  },
});
