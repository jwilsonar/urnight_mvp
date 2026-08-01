/** Entradas del asistente (SD-06): sincroniza con red y opera desde la copia local sin ella. */
import { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import type { TicketResponse } from '@urnight/contracts';
import { fetchMyTickets } from '../../lib/api-client';
import { NetworkError } from '../../lib/errors';
import { formatEventDate } from '../../lib/format';
import { useIsOnline } from '../../lib/net';
import { resolveStorageUrl } from '../../lib/storage';
import { readCachedTickets, writeTickets } from '../../lib/tickets-cache';
import { useAuth } from '../../lib/auth-context';
import { color, radius, space, type } from '../../lib/theme';
import { Flyer } from '../../components/flyer';
import { EmptyState, Eyebrow, LoadingState } from '../../components/ui';

const STATUS_LABELS: Record<TicketResponse['status'], string> = {
  valid: 'Vigente',
  used: 'Usada',
  cancelled: 'Cancelada',
  expired: 'Vencida',
};

/** Vigentes primero, el resto debajo y por fecha de evento descendente. */
function sortTickets(tickets: TicketResponse[]): TicketResponse[] {
  return [...tickets].sort((a, b) => {
    if (a.status === 'valid' && b.status !== 'valid') return -1;
    if (b.status === 'valid' && a.status !== 'valid') return 1;
    return (b.eventStartsAt ?? '').localeCompare(a.eventStartsAt ?? '');
  });
}

function TicketRow({ ticket, onPress }: { ticket: TicketResponse; onPress: () => void }) {
  const stale = ticket.status !== 'valid';
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, stale && styles.rowStale, pressed && styles.rowPressed]}
    >
      <View style={styles.rowFlyer}>
        <Flyer
          url={resolveStorageUrl(ticket.eventFlyerKey)}
          aspectRatio={1}
          borderRadius={radius.sm}
        />
      </View>
      <View style={styles.rowInfo}>
        <Text style={styles.rowEvent} numberOfLines={1}>
          {ticket.eventName ?? 'Evento'}
        </Text>
        {ticket.eventStartsAt ? (
          <Text style={styles.rowDate}>{formatEventDate(ticket.eventStartsAt)}</Text>
        ) : null}
        <Text style={styles.rowMeta} numberOfLines={1}>
          {[ticket.ticketTypeName, ticket.attendeeName].filter(Boolean).join(' · ')}
        </Text>
      </View>
      <Text style={[styles.rowStatus, stale && styles.rowStatusStale]}>
        {STATUS_LABELS[ticket.status]}
      </Text>
    </Pressable>
  );
}

export default function TicketsScreen() {
  const router = useRouter();
  const { status: session } = useAuth();
  const online = useIsOnline();
  const [tickets, setTickets] = useState<TicketResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fromCache, setFromCache] = useState(false);
  const [syncedAt, setSyncedAt] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (session !== 'authenticated') {
      setLoading(false);
      return;
    }
    try {
      const fresh = await fetchMyTickets();
      await writeTickets(fresh);
      setTickets(sortTickets(fresh));
      setFromCache(false);
      setSyncedAt(new Date().toISOString());
    } catch (err) {
      // Sin red se cae a la copia local (SD-06 fase 1). Un ApiError se trata
      // igual: mejor mostrar lo guardado que una pantalla vacía en la puerta.
      const cached = await readCachedTickets();
      setTickets(sortTickets(cached.tickets));
      setFromCache(true);
      setSyncedAt(cached.syncedAt);
      if (!(err instanceof NetworkError) && cached.tickets.length === 0) {
        setTickets([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session]);

  // Al enfocar y al recuperar red: el estado de la entrada pudo cambiar en puerta.
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  if (session === 'restoring' || loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <LoadingState label="Cargando tus entradas…" />
      </SafeAreaView>
    );
  }

  if (session !== 'authenticated') {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <Eyebrow>Entradas</Eyebrow>
          <Text style={styles.title}>Tus entradas</Text>
        </View>
        <EmptyState
          title="Ingresa para ver tus entradas"
          subtitle="Con tu cuenta llevas el QR en el teléfono, incluso sin señal en la puerta."
          actionLabel="Ingresar"
          onAction={() => router.push('/login')}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Eyebrow>Entradas</Eyebrow>
        <Text style={styles.title}>Tus entradas</Text>
      </View>
      {fromCache ? (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>
            {syncedAt
              ? `Mostrando datos guardados · última sincronización ${formatEventDate(syncedAt)}`
              : 'Mostrando datos guardados'}
          </Text>
        </View>
      ) : null}
      <FlatList
        data={tickets}
        keyExtractor={(t) => t.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void load();
            }}
            tintColor={color.crimson}
          />
        }
        ListEmptyComponent={
          <EmptyState
            title={online ? 'Aún no tienes entradas' : 'Sin entradas guardadas'}
            subtitle={
              online
                ? 'Cuando compres una noche, tu QR vivirá aquí.'
                : 'Conéctate una vez para guardar tus entradas en el teléfono.'
            }
            actionLabel="Explorar eventos"
            onAction={() => router.push('/eventos')}
          />
        }
        renderItem={({ item }) => (
          <TicketRow ticket={item} onPress={() => router.push(`/entrada/${item.id}`)} />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: color.bgRoot },
  header: { padding: space.s4, gap: space.s2 },
  title: { ...type.h1, color: color.textPrimary },
  offlineBanner: {
    marginHorizontal: space.s4,
    marginBottom: space.s3,
    padding: space.s3,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: color.warning,
    backgroundColor: color.warningSoft,
  },
  offlineText: { ...type.caption, color: color.warningFg },
  list: { paddingHorizontal: space.s4, paddingBottom: space.s8, gap: space.s3 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.s3,
    padding: space.s3,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: color.borderFaint,
    backgroundColor: color.bgSurface,
  },
  rowStale: { opacity: 0.5 },
  rowPressed: { opacity: 0.8 },
  rowFlyer: { width: 56 },
  rowInfo: { flex: 1, gap: space.s1 },
  rowEvent: { ...type.title, color: color.textPrimary },
  rowDate: { ...type.caption, color: color.textSecondary },
  rowMeta: { ...type.caption, color: color.textMuted },
  rowStatus: { ...type.caption, color: color.successFg },
  rowStatusStale: { color: color.textFaint },
});
