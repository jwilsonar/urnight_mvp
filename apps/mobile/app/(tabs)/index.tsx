/** Inicio: hero con el próximo evento + rail de próximos (endpoints públicos §7). */
import { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, type Href } from 'expo-router';
import type { EventResponse } from '@urnight/contracts';
import { fetchUpcomingEvents } from '../../lib/api-client';
import { formatEventDate } from '../../lib/format';
import { color, radius, space, type } from '../../lib/theme';
import { EventCard } from '../../components/event-card';
import { Flyer } from '../../components/flyer';
import { Button, EmptyState, ErrorState, Eyebrow, LoadingState, SectionHead } from '../../components/ui';

type Status = 'loading' | 'ready' | 'error';

export default function HomeScreen() {
  const router = useRouter();
  const [events, setEvents] = useState<EventResponse[]>([]);
  const [status, setStatus] = useState<Status>('loading');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await fetchUpcomingEvents();
      setEvents(data);
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const [hero, ...rest] = events;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={color.crimson} />
        }
      >
        <View style={styles.brandRow}>
          <Text style={styles.wordmark}>RAVENUE</Text>
          <Eyebrow>La noche empieza aquí</Eyebrow>
        </View>

        {status === 'loading' ? <LoadingState /> : null}
        {status === 'error' ? (
          <ErrorState message="Revisa tu conexión y vuelve a intentarlo." onRetry={load} />
        ) : null}

        {status === 'ready' && !hero ? (
          <EmptyState
            title="Aún no hay noches anunciadas"
            subtitle="Cuando un local publique su próximo evento, aparecerá aquí."
          />
        ) : null}

        {hero ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push(`/evento/${hero.slug}` as Href)}
            style={({ pressed }) => [styles.hero, pressed && styles.heroPressed]}
          >
            <Flyer url={hero.flyerUrl} aspectRatio={3 / 4} borderRadius={radius.xl} />
            <LinearGradient
              colors={['transparent', 'rgba(5, 5, 10, 0.55)', color.bgRoot]}
              locations={[0.35, 0.72, 1]}
              style={styles.heroScrim}
            />
            <View style={styles.heroBody}>
              <Text style={styles.heroDate}>{formatEventDate(hero.startsAt)}</Text>
              <Text style={styles.heroName} numberOfLines={2}>
                {hero.name}
              </Text>
              <Button label="Ver evento" onPress={() => router.push(`/evento/${hero.slug}` as Href)} />
            </View>
          </Pressable>
        ) : null}

        {rest.length > 0 ? (
          <View style={styles.section}>
            <SectionHead title="Próximas noches" subtitle="Lo que viene en tus locales" />
            <FlatList
              horizontal
              data={rest}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <EventCard event={item} />}
              contentContainerStyle={styles.rail}
              showsHorizontalScrollIndicator={false}
            />
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: color.bgRoot,
  },
  content: {
    padding: space.s4,
    paddingBottom: space.s8,
    gap: space.s6,
  },
  brandRow: {
    gap: space.s1,
  },
  wordmark: {
    ...type.h2,
    color: color.moon,
    letterSpacing: 3,
  },
  hero: {
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  heroPressed: {
    opacity: 0.92,
  },
  heroScrim: {
    ...StyleSheet.absoluteFillObject,
  },
  heroBody: {
    position: 'absolute',
    left: space.s4,
    right: space.s4,
    bottom: space.s4,
    gap: space.s2,
  },
  heroDate: {
    ...type.label,
    color: color.actionLink,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  heroName: {
    ...type.h1,
    color: color.moon,
  },
  section: {
    gap: space.s2,
  },
  rail: {
    gap: space.s3,
    paddingRight: space.s4,
  },
});
