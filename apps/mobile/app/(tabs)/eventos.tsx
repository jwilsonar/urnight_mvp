/** Lista de eventos con búsqueda pública (GET /events, #3). */
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { EventResponse } from '@urnight/contracts';
import { fetchEvents } from '../../lib/api-client';
import { color, radius, space, type } from '../../lib/theme';
import { EventRow } from '../../components/event-card';
import { EmptyState, ErrorState, Eyebrow, LoadingState } from '../../components/ui';

type Status = 'loading' | 'ready' | 'error';

export default function EventsScreen() {
  const [query, setQuery] = useState('');
  const [events, setEvents] = useState<EventResponse[]>([]);
  const [status, setStatus] = useState<Status>('loading');
  const [refreshing, setRefreshing] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async (q: string) => {
    try {
      const data = await fetchEvents(q.trim() ? { q: q.trim() } : undefined);
      setEvents(data);
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    void load('');
  }, [load]);

  const onChangeQuery = useCallback(
    (text: string) => {
      setQuery(text);
      if (debounce.current) clearTimeout(debounce.current);
      debounce.current = setTimeout(() => {
        setStatus('loading');
        void load(text);
      }, 350);
    },
    [load],
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load(query);
    setRefreshing(false);
  }, [load, query]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Eyebrow>Catálogo</Eyebrow>
        <Text style={styles.title}>Eventos</Text>
        <TextInput
          value={query}
          onChangeText={onChangeQuery}
          placeholder="Busca tu noche…"
          placeholderTextColor={color.textFaint}
          style={styles.search}
          autoCapitalize="none"
          returnKeyType="search"
        />
      </View>

      {status === 'loading' ? <LoadingState /> : null}
      {status === 'error' ? (
        <ErrorState message="No pudimos cargar los eventos." onRetry={() => void load(query)} />
      ) : null}

      {status === 'ready' ? (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <EventRow event={item} />}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={color.crimson} />
          }
          ListEmptyComponent={
            <EmptyState
              title="Nada por aquí"
              subtitle={
                query.trim()
                  ? `Sin resultados para “${query.trim()}”. Prueba con otro nombre.`
                  : 'Todavía no hay eventos publicados.'
              }
            />
          }
        />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: color.bgRoot,
  },
  header: {
    padding: space.s4,
    gap: space.s2,
  },
  title: {
    ...type.h1,
    color: color.textPrimary,
  },
  search: {
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: color.steel,
    backgroundColor: color.fieldBg,
    paddingHorizontal: space.s4,
    color: color.textPrimary,
    ...type.body,
  },
  list: {
    paddingHorizontal: space.s4,
    paddingBottom: space.s8,
    gap: space.s3,
  },
});
