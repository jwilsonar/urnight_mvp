/** Tarjetas de evento del catálogo (rail horizontal y lista vertical). */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import type { EventResponse } from '@urnight/contracts';
import { formatEventDate } from '../lib/format';
import { color, radius, space, type } from '../lib/theme';
import { Flyer } from './flyer';

/** Señal editorial calculada por el backend (`catalogLabel`), nunca inventada aquí. */
const CATALOG_LABELS: Record<string, string> = {
  popular: 'Popular',
  trending: 'Tendencia',
  fewTickets: 'Últimas entradas',
};

function CatalogBadge({ label }: { label: string | null | undefined }) {
  if (!label || !CATALOG_LABELS[label]) return null;
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{CATALOG_LABELS[label]}</Text>
    </View>
  );
}

/** Card vertical para rails horizontales (ancho fijo). */
export function EventCard({ event }: { event: EventResponse }) {
  const router = useRouter();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push(`/evento/${event.slug}` as Href)}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View>
        <Flyer url={event.flyerUrl} />
        <CatalogBadge label={event.catalogLabel} />
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.date}>{formatEventDate(event.startsAt)}</Text>
        <Text style={styles.name} numberOfLines={2}>
          {event.name}
        </Text>
      </View>
    </Pressable>
  );
}

/** Fila horizontal para la lista de eventos. */
export function EventRow({ event }: { event: EventResponse }) {
  const router = useRouter();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push(`/evento/${event.slug}` as Href)}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.rowFlyer}>
        <Flyer url={event.flyerUrl} aspectRatio={4 / 5} borderRadius={radius.md} />
      </View>
      <View style={styles.rowBody}>
        <Text style={styles.date}>{formatEventDate(event.startsAt)}</Text>
        <Text style={styles.name} numberOfLines={2}>
          {event.name}
        </Text>
        {event.minAgeNote ? <Text style={styles.meta}>{event.minAgeNote}</Text> : null}
        <CatalogBadge label={event.catalogLabel} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 200,
    gap: space.s2,
  },
  cardBody: {
    gap: 2,
  },
  row: {
    flexDirection: 'row',
    gap: space.s3,
    backgroundColor: color.bgSurface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: color.borderFaint,
    padding: space.s3,
  },
  rowFlyer: {
    width: 92,
  },
  rowBody: {
    flex: 1,
    gap: space.s1,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  pressed: {
    opacity: 0.85,
  },
  date: {
    ...type.caption,
    color: color.actionLink,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  name: {
    ...type.title,
    color: color.textPrimary,
  },
  meta: {
    ...type.caption,
    color: color.textMuted,
  },
  badge: {
    position: 'absolute',
    top: space.s2,
    left: space.s2,
    paddingHorizontal: space.s2,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(9, 9, 13, 0.78)',
    borderWidth: 1,
    borderColor: color.accentBorder,
  },
  badgeText: {
    ...type.caption,
    fontSize: 11,
    color: color.moon,
  },
});
