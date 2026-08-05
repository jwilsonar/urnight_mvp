/** Aterrizaje del código de promotor (SD-04 fase 3): resuelve la oferta y precarga el checkout. */
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { ResolveRedemptionCodeResponse } from '@urnight/contracts';
import { registerRedemptionClick, resolveRedemptionCode } from '../../lib/api-client';
import { formatEventDate, formatPrice } from '../../lib/format';
import { color, radius, space, type } from '../../lib/theme';
import { Button, EmptyState, ErrorState, Eyebrow, LoadingState } from '../../components/ui';

export default function RedemptionCodeScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const router = useRouter();
  const [offer, setOffer] = useState<ResolveRedemptionCodeResponse | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  const load = useCallback(async () => {
    if (!code) return;
    setStatus('loading');
    try {
      setOffer(await resolveRedemptionCode(code));
      setStatus('ready');
      // Atribución del promotor: best-effort, jamás bloquea ni rompe la pantalla.
      void registerRedemptionClick(code).catch(() => undefined);
    } catch {
      setStatus('error');
    }
  }, [code]);

  useEffect(() => {
    void load();
  }, [load]);

  if (status === 'loading') {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <LoadingState label="Abriendo tu invitación…" />
      </SafeAreaView>
    );
  }

  if (status === 'error' || !offer) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ErrorState message="No pudimos abrir esta invitación." onRetry={() => void load()} />
      </SafeAreaView>
    );
  }

  if (!offer.valid || !offer.event) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <EmptyState
          title="Invitación no disponible"
          subtitle={offer.reason ?? 'Este código ya no es válido.'}
          actionLabel="Explorar eventos"
          onAction={() => router.replace('/eventos')}
        />
      </SafeAreaView>
    );
  }

  const event = offer.event;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.head}>
          <Eyebrow>{offer.promoterName ? `Te invita ${offer.promoterName}` : 'Invitación'}</Eyebrow>
          <Text style={styles.title}>{event.name}</Text>
          <Text style={styles.date}>{formatEventDate(event.startsAt)}</Text>
        </View>

        <View style={styles.offerBox}>
          <Text style={styles.offerTitle}>
            {offer.isFree ? 'Entrada gratis' : 'Descuento aplicado'}
          </Text>
          {offer.ticketType ? (
            <Text style={styles.offerLine}>
              {offer.ticketType.name} ·{' '}
              {formatPrice(offer.ticketType.price, offer.ticketType.currency)}
            </Text>
          ) : null}
          {offer.savings > 0 ? (
            <Text style={styles.offerSavings}>Ahorras {formatPrice(offer.savings)}</Text>
          ) : null}
        </View>

        <Button
          label="Continuar con la compra"
          onPress={() =>
            router.push({
              pathname: '/comprar/[eventId]',
              params: { eventId: event.id, slug: event.slug, code: offer.code },
            })
          }
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: color.bgRoot },
  scroll: { flexGrow: 1, padding: space.s6, gap: space.s6, justifyContent: 'center' },
  head: { gap: space.s2 },
  title: { ...type.h1, color: color.textPrimary },
  date: { ...type.bodySm, color: color.textSecondary },
  offerBox: {
    padding: space.s4,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: color.accentBorder,
    backgroundColor: color.accentSoft,
    gap: space.s2,
  },
  offerTitle: { ...type.h3, color: color.textPrimary },
  offerLine: { ...type.bodySm, color: color.textSecondary },
  offerSavings: { ...type.label, color: color.successFg },
});
