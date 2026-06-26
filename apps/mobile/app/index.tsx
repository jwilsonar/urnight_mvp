import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { fetchHealth, type HealthResponse } from '../lib/api-client';

export default function HomeScreen() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHealth()
      .then(setHealth)
      .catch((err: Error) => setError(err.message));
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>UrNight</Text>
      <Text style={styles.subtitle}>App del asistente — Fase 1 (foundation)</Text>
      <Text style={styles.status}>
        API: {error ? `error (${error})` : (health?.status ?? 'cargando…')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 8 },
  title: { fontSize: 28, fontWeight: '700' },
  subtitle: { color: '#52525b' },
  status: { marginTop: 12 },
});
