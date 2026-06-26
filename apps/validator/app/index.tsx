import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { countPending } from '../lib/offline-cache';

export default function HomeScreen() {
  const [pending, setPending] = useState<number>(0);

  useEffect(() => {
    countPending()
      .then(setPending)
      .catch(() => setPending(0));
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Validación de puerta</Text>
      <Text style={styles.subtitle}>Fase 1 (foundation)</Text>
      <Text style={styles.pending}>Check-ins pendientes: {pending}</Text>
      <Link href="/scan" style={styles.link}>
        Escanear QR →
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 8 },
  title: { fontSize: 26, fontWeight: '700' },
  subtitle: { color: '#52525b' },
  pending: { marginTop: 12 },
  link: { marginTop: 16, color: '#2563eb', fontSize: 18 },
});
