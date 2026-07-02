import { Link, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../lib/auth-context';
import { countPending } from '../lib/offline-cache';

export default function HomeScreen() {
  const { runSync, signOut } = useAuth();
  const [pending, setPending] = useState<number>(0);

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
    await runSync();
    refresh();
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Validación de puerta</Text>
      <Text style={styles.pending}>Check-ins pendientes: {pending}</Text>
      <Link href="/scan" style={styles.link}>
        Escanear QR →
      </Link>
      {pending > 0 ? (
        <View style={styles.action}>
          <Button title="Sincronizar ahora" onPress={onSync} />
        </View>
      ) : null}
      <View style={styles.action}>
        <Button title="Cerrar sesión" color="#dc2626" onPress={signOut} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 8 },
  title: { fontSize: 26, fontWeight: '700' },
  pending: { marginTop: 12 },
  link: { marginTop: 16, color: '#2563eb', fontSize: 18 },
  action: { marginTop: 16 },
});
