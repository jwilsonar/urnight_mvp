/** Entrada a pantalla completa (SD-06 fase 2): QR grande, sin red, con brillo al máximo. */
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import * as Brightness from 'expo-brightness';
import type { TicketResponse } from '@urnight/contracts';
import { fetchMyTickets } from '../../lib/api-client';
import { formatEventDate } from '../../lib/format';
import { createLogger } from '../../lib/logger';
import { useIsOnline } from '../../lib/net';
import { readCachedTickets, writeTickets } from '../../lib/tickets-cache';
import { color, radius, space, type } from '../../lib/theme';
import { TicketQr } from '../../components/qr';
import { ErrorState, Eyebrow, LoadingState } from '../../components/ui';

const log = createLogger('ticket-detail');

const STATUS_LABELS: Record<TicketResponse['status'], string> = {
  valid: 'Vigente',
  used: 'Ya utilizada',
  cancelled: 'Cancelada',
  expired: 'Vencida',
};

/**
 * Sube el brillo al máximo mientras el QR está en pantalla y restaura el valor
 * previo al salir Y al pasar a segundo plano. Sin la restauración, la app deja
 * el teléfono al 100% y quema batería en la cola.
 */
function useMaxBrightness() {
  const previous = useRef<number | null>(null);

  useEffect(() => {
    let active = true;
    const restore = async () => {
      if (previous.current === null) return;
      try {
        await Brightness.setBrightnessAsync(previous.current);
      } catch (err) {
        log.warn({ err: (err as Error).message }, 'mobile.ticket.brightness_restore_failed');
      }
    };

    Brightness.getBrightnessAsync()
      .then(async (value) => {
        if (!active) return;
        previous.current = value;
        await Brightness.setBrightnessAsync(1);
      })
      .catch((err: unknown) => {
        log.warn({ err: (err as Error).message }, 'mobile.ticket.brightness_failed');
      });

    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') void restore();
    });

    return () => {
      active = false;
      sub.remove();
      void restore();
    };
  }, []);
}

export default function TicketDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const online = useIsOnline();
  const [ticket, setTicket] = useState<TicketResponse | null>(null);
  const [loading, setLoading] = useState(true);
  useMaxBrightness();

  const load = useCallback(async () => {
    if (!id) return;
    // La copia local primero: la puerta puede no tener cobertura.
    const cached = await readCachedTickets();
    const local = cached.tickets.find((t) => t.id === id) ?? null;
    setTicket(local);
    setLoading(false);
    if (!online) return;
    try {
      const fresh = await fetchMyTickets();
      await writeTickets(fresh);
      setTicket(fresh.find((t) => t.id === id) ?? local);
    } catch {
      // Se queda con la copia local: es exactamente para esto.
    }
  }, [id, online]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <LoadingState label="Abriendo tu entrada…" />
      </SafeAreaView>
    );
  }

  if (!ticket) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ErrorState message="No encontramos esta entrada en el teléfono." />
      </SafeAreaView>
    );
  }

  const stale = ticket.status !== 'valid';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.head}>
          <Eyebrow>{ticket.ticketTypeName ?? 'Entrada'}</Eyebrow>
          <Text style={styles.event}>{ticket.eventName ?? 'Evento'}</Text>
          {ticket.eventStartsAt ? (
            <Text style={styles.date}>{formatEventDate(ticket.eventStartsAt)}</Text>
          ) : null}
          {ticket.venueName ? <Text style={styles.venue}>{ticket.venueName}</Text> : null}
        </View>

        <View style={styles.qrWrap}>
          <TicketQr qrCode={ticket.qrCode} qrImageKey={ticket.qrImageKey} online={online} />
          {stale ? (
            <View style={styles.stamp}>
              <Text style={styles.stampText}>{STATUS_LABELS[ticket.status]}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.foot}>
          <Text style={styles.attendee}>{ticket.attendeeName}</Text>
          <Text style={[styles.status, stale && styles.statusStale]}>
            {STATUS_LABELS[ticket.status]}
          </Text>
          <Text style={styles.note}>
            Muestra este código en la puerta. Funciona sin conexión.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: color.bgRoot },
  scroll: { flexGrow: 1, padding: space.s6, gap: space.s8, justifyContent: 'center' },
  head: { gap: space.s1, alignItems: 'center' },
  event: { ...type.h2, color: color.textPrimary, textAlign: 'center' },
  date: { ...type.bodySm, color: color.textSecondary },
  venue: { ...type.caption, color: color.textMuted },
  qrWrap: { alignItems: 'center', justifyContent: 'center' },
  stamp: {
    position: 'absolute',
    paddingHorizontal: space.s4,
    paddingVertical: space.s2,
    borderRadius: radius.sm,
    backgroundColor: color.errorSoft,
    borderWidth: 1,
    borderColor: color.error,
  },
  stampText: { ...type.label, color: color.errorFg, textTransform: 'uppercase' },
  foot: { gap: space.s2, alignItems: 'center' },
  attendee: { ...type.title, color: color.textPrimary },
  status: { ...type.caption, color: color.successFg },
  statusStale: { color: color.errorFg },
  note: { ...type.caption, color: color.textMuted, textAlign: 'center' },
});
