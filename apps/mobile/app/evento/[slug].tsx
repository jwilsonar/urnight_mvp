/** Ficha pública del evento: flyer, datos y tramos de entrada (SD-04 fase 2). */
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import type {
  EventResponse,
  LocalListResponse,
  TicketTypeResponse,
} from '@urnight/contracts';
import {
  fetchEventBySlug,
  fetchEventTicketTypes,
  fetchLocals,
} from '../../lib/api-client';
import { formatEventDate, formatPrice } from '../../lib/format';
import { color, radius, space, type } from '../../lib/theme';
import { Flyer } from '../../components/flyer';
import { Button, Chip, ErrorState, LoadingState, SectionHead } from '../../components/ui';

type Status = 'loading' | 'ready' | 'error';

const TIER_LABELS: Record<TicketTypeResponse['tierCode'], string> = {
  general: 'General',
  vip: 'VIP',
  premium: 'Premium',
};

function TicketRow({ ticket }: { ticket: TicketTypeResponse }) {
  const soldOut = ticket.status === 'sold_out' || ticket.remaining <= 0;
  return (
    <View style={[styles.ticketRow, soldOut && styles.ticketRowSoldOut]}>
      <View style={styles.ticketInfo}>
        <Text style={styles.ticketName}>{ticket.name}</Text>
        <Text style={styles.ticketTier}>{TIER_LABELS[ticket.tierCode]}</Text>
      </View>
      {soldOut ? (
        <Text style={styles.soldOut}>Agotado</Text>
      ) : (
        <Text style={styles.ticketPrice}>{formatPrice(ticket.price, ticket.currency)}</Text>
      )}
    </View>
  );
}

export default function EventDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const [event, setEvent] = useState<EventResponse | null>(null);
  const [tickets, setTickets] = useState<TicketTypeResponse[]>([]);
  const [localName, setLocalName] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  const hasTickets = tickets.some((t) => t.status === 'active' && t.remaining > 0);

  const load = useCallback(async () => {
    if (!slug) return;
    setStatus('loading');
    try {
      const detail = await fetchEventBySlug(slug);
      setEvent(detail);
      const [ticketTypes, locals] = await Promise.allSettled([
        fetchEventTicketTypes(detail.id),
        fetchLocals(),
      ]);
      if (ticketTypes.status === 'fulfilled') setTickets(ticketTypes.value);
      if (locals.status === 'fulfilled') {
        const match = (locals.value as LocalListResponse).find(
          (l) => l.id === detail.localId,
        );
        setLocalName(match?.name ?? null);
      }
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, [slug]);

  useEffect(() => {
    void load();
  }, [load]);

  if (status === 'loading') {
    return (
      <View style={styles.stateWrap}>
        <LoadingState />
      </View>
    );
  }
  if (status === 'error' || !event) {
    return (
      <View style={styles.stateWrap}>
        <ErrorState message="No encontramos este evento." onRetry={load} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.flyerWrap}>
        <Flyer url={event.flyerUrl} aspectRatio={4 / 5} borderRadius={0} />
        <LinearGradient
          colors={['rgba(5, 5, 10, 0.2)', 'transparent', color.bgRoot]}
          locations={[0, 0.45, 1]}
          style={StyleSheet.absoluteFill}
        />
      </View>

      <View style={styles.body}>
        {event.status === 'cancelled' ? (
          <View style={styles.cancelledBanner}>
            <Ionicons name="alert-circle" size={16} color={color.errorFg} />
            <Text style={styles.cancelledText}>Evento cancelado</Text>
          </View>
        ) : null}

        <Text style={styles.date}>{formatEventDate(event.startsAt)}</Text>
        <Text style={styles.name}>{event.name}</Text>

        {localName ? (
          <View style={styles.localRow}>
            <Ionicons name="location-outline" size={16} color={color.smoke} />
            <Text style={styles.localName}>{localName}</Text>
          </View>
        ) : null}

        <View style={styles.chips}>
          {event.minAgeNote ? <Chip label={event.minAgeNote} /> : null}
          {event.dressCode ? <Chip label={event.dressCode} /> : null}
          {event.customTags.map((tag) => (
            <Chip key={tag} label={tag} />
          ))}
        </View>

        {event.description ? (
          <Text style={styles.description}>{event.description}</Text>
        ) : null}

        <View style={styles.ticketsSection}>
          <SectionHead title="Entradas" subtitle="Tramos publicados por el local" />
          {tickets.length === 0 ? (
            <Text style={styles.noTickets}>Este evento aún no publica entradas.</Text>
          ) : (
            <View style={styles.ticketList}>
              {tickets.map((ticket) => (
                <TicketRow key={ticket.id} ticket={ticket} />
              ))}
            </View>
          )}
        </View>

        <Button
          label={hasTickets ? 'Comprar entradas' : 'Sin entradas a la venta'}
          disabled={!hasTickets}
          onPress={() =>
            router.push({
              pathname: '/comprar/[eventId]',
              params: { eventId: event.id, slug: event.slug },
            })
          }
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: color.bgRoot,
  },
  content: {
    paddingBottom: space.s12,
  },
  stateWrap: {
    flex: 1,
    backgroundColor: color.bgRoot,
    justifyContent: 'center',
  },
  flyerWrap: {
    width: '100%',
  },
  body: {
    paddingHorizontal: space.s4,
    marginTop: -space.s8,
    gap: space.s3,
  },
  cancelledBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.s2,
    alignSelf: 'flex-start',
    backgroundColor: color.errorSoft,
    borderRadius: radius.pill,
    paddingHorizontal: space.s3,
    paddingVertical: space.s1,
  },
  cancelledText: {
    ...type.label,
    color: color.errorFg,
  },
  date: {
    ...type.label,
    color: color.actionLink,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  name: {
    ...type.display,
    fontSize: 34,
    lineHeight: 40,
    color: color.moon,
  },
  localRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.s1,
  },
  localName: {
    ...type.bodySm,
    color: color.textSecondary,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.s2,
  },
  description: {
    ...type.body,
    color: color.textSecondary,
  },
  ticketsSection: {
    marginTop: space.s3,
  },
  ticketList: {
    gap: space.s2,
  },
  noTickets: {
    ...type.bodySm,
    color: color.textMuted,
  },
  ticketRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: color.bgSurface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: color.borderFaint,
    paddingHorizontal: space.s4,
    paddingVertical: space.s3,
  },
  ticketRowSoldOut: {
    opacity: 0.6,
  },
  ticketInfo: {
    gap: 2,
  },
  ticketName: {
    ...type.title,
    fontSize: 16,
    color: color.textPrimary,
  },
  ticketTier: {
    ...type.caption,
    color: color.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  ticketPrice: {
    ...type.h3,
    color: color.moon,
  },
  soldOut: {
    ...type.label,
    color: color.errorFg,
  },
});
