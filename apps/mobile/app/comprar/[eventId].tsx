/** Compra desde el móvil (SD-05): reserva de cupo, asistentes e idempotencia. */
import { useCallback, useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { CreateOrderDto, EventResponse, TicketTypeResponse } from '@urnight/contracts';
import { fetchEventBySlug, fetchEventTicketTypes } from '../../lib/api-client';
import { formatPrice } from '../../lib/format';
import { useIsOnline } from '../../lib/net';
import { useAuth } from '../../lib/auth-context';
import { useCheckout } from '../../lib/use-checkout';
import { color, radius, space, type } from '../../lib/theme';
import { TicketQr } from '../../components/qr';
import {
  Button,
  EmptyState,
  ErrorState,
  Eyebrow,
  Field,
  LoadingState,
  SectionHead,
} from '../../components/ui';

const METHODS: { value: CreateOrderDto['method']; label: string }[] = [
  { value: 'card', label: 'Tarjeta' },
  { value: 'yape', label: 'Yape' },
  { value: 'plin', label: 'Plin' },
];

function CheckoutForm({
  event,
  ticketTypes,
  presetCode,
}: {
  event: EventResponse;
  ticketTypes: TicketTypeResponse[];
  presetCode?: string;
}) {
  const router = useRouter();
  const online = useIsOnline();
  const co = useCheckout({ event, ticketTypes, presetCode });

  if (co.result) {
    return (
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.head}>
          <Eyebrow>Compra confirmada</Eyebrow>
          <Text style={styles.title}>{event.name}</Text>
          <Text style={styles.subtitle}>
            Orden {co.result.order.orderCode} ·{' '}
            {formatPrice(co.result.order.total, co.result.order.currency)}
          </Text>
        </View>
        {co.result.tickets.map((ticket) => (
          <View key={ticket.id} style={styles.successTicket}>
            <TicketQr
              qrCode={ticket.qrCode}
              qrImageKey={ticket.qrImageKey}
              online={online}
              size={180}
            />
            <Text style={styles.attendee}>{ticket.attendeeName}</Text>
          </View>
        ))}
        <Button label="Ver mis entradas" onPress={() => router.replace('/entradas')} />
      </ScrollView>
    );
  }

  if (co.available.length === 0) {
    return (
      <EmptyState
        title="Sin entradas disponibles"
        subtitle="Este evento no tiene tramos a la venta ahora mismo."
        actionLabel="Volver"
        onAction={() => router.back()}
      />
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.head}>
          <Eyebrow>Compra</Eyebrow>
          <Text style={styles.title}>{event.name}</Text>
        </View>

        {co.formError ? (
          <View style={styles.alert}>
            <Text style={styles.alertText}>{co.formError}</Text>
          </View>
        ) : null}

        <View style={styles.block}>
          <SectionHead title="Tramo" subtitle="Elige tu tipo de entrada" />
          {co.available.map((tt) => (
            <Pressable
              key={tt.id}
              accessibilityRole="button"
              onPress={() => co.setTicketTypeId(tt.id)}
              style={[styles.option, co.ticketTypeId === tt.id && styles.optionActive]}
            >
              <Text style={styles.optionLabel}>{tt.name}</Text>
              <Text style={styles.optionPrice}>{formatPrice(tt.price, tt.currency)}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.block}>
          <SectionHead
            title="Asistentes"
            subtitle={`Todos deben ser mayores de 18 años · máximo ${co.maxQty}`}
          />
          {co.attendees.map((attendee, index) => (
            <View key={index} style={styles.attendeeCard}>
              <Text style={styles.attendeeTitle}>
                {index === 0 ? 'Titular de la compra' : `Asistente ${index + 1}`}
              </Text>
              <Field
                label="Nombre completo"
                value={attendee.fullName}
                onChangeText={(v) => co.updateAttendee(index, { fullName: v })}
                error={co.fieldErrors[`${index}.fullName`]}
                autoCapitalize="words"
                editable={!co.pending}
              />
              <Field
                label="Número de documento"
                value={attendee.documentNumber}
                onChangeText={(v) => co.updateAttendee(index, { documentNumber: v })}
                error={co.fieldErrors[`${index}.documentNumber`]}
                keyboardType="number-pad"
                editable={!co.pending}
              />
              <Field
                label="Fecha de nacimiento"
                placeholder="AAAA-MM-DD"
                value={attendee.birthDate}
                onChangeText={(v) => co.updateAttendee(index, { birthDate: v })}
                error={co.fieldErrors[`${index}.birthDate`]}
                autoCapitalize="none"
                editable={!co.pending}
              />
              {index > 0 ? (
                <Button
                  label="Quitar"
                  variant="secondary"
                  onPress={() => co.removeAttendee(index)}
                  disabled={co.pending}
                />
              ) : null}
            </View>
          ))}
          {co.attendees.length < co.maxQty ? (
            <Button
              label="Agregar asistente"
              variant="secondary"
              onPress={co.addAttendee}
              disabled={co.pending}
            />
          ) : null}
        </View>

        <View style={styles.block}>
          <SectionHead title="Pago" />
          <View style={styles.methods}>
            {METHODS.map((m) => (
              <Pressable
                key={m.value}
                accessibilityRole="button"
                onPress={() => co.setMethod(m.value)}
                style={[styles.method, co.method === m.value && styles.optionActive]}
              >
                <Text style={styles.optionLabel}>{m.label}</Text>
              </Pressable>
            ))}
          </View>
          <Field
            label="Código promocional (opcional)"
            value={co.promoCode}
            onChangeText={co.setPromoCode}
            autoCapitalize="characters"
            editable={!co.pending}
          />
        </View>

        <View style={styles.summary}>
          <Text style={styles.summaryLabel}>Total</Text>
          <Text style={styles.summaryValue}>
            {formatPrice(co.subtotal, co.selected?.currency ?? 'PEN')}
          </Text>
        </View>

        <Button
          label={
            co.retrying
              ? 'Sin conexión, reintentando…'
              : co.pending
                ? 'Procesando…'
                : co.holdPending
                  ? 'Reservando cupo…'
                  : 'Pagar'
          }
          onPress={() => void co.submit()}
          disabled={co.pending || co.holdPending || !co.hold}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export default function CheckoutScreen() {
  const { eventId, slug, code } = useLocalSearchParams<{
    eventId: string;
    slug?: string;
    code?: string;
  }>();
  const router = useRouter();
  const { status: session } = useAuth();
  const [event, setEvent] = useState<EventResponse | null>(null);
  const [ticketTypes, setTicketTypes] = useState<TicketTypeResponse[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  // `eventId` es el identificador de ruta, pero el detalle público se pide por
  // slug: la ficha lo pasa como parámetro para no añadir un endpoint nuevo.
  const load = useCallback(async () => {
    if (!slug) {
      setStatus('error');
      return;
    }
    setStatus('loading');
    try {
      const detail = await fetchEventBySlug(slug);
      setEvent(detail);
      setTicketTypes(await fetchEventTicketTypes(detail.id));
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, [slug]);

  useEffect(() => {
    void load();
  }, [load]);

  if (session === 'restoring' || status === 'loading') {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <LoadingState label="Preparando tu compra…" />
      </SafeAreaView>
    );
  }

  if (session !== 'authenticated') {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <EmptyState
          title="Ingresa para comprar"
          subtitle="Necesitas tu cuenta de Ravenue para emitir entradas a tu nombre."
          actionLabel="Ingresar"
          onAction={() => router.push('/login')}
        />
      </SafeAreaView>
    );
  }

  if (status === 'error' || !event || event.id !== eventId) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ErrorState message="No pudimos cargar este evento." onRetry={() => void load()} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <CheckoutForm event={event} ticketTypes={ticketTypes} presetCode={code} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: color.bgRoot },
  flex: { flex: 1 },
  scroll: { padding: space.s4, gap: space.s6, paddingBottom: space.s16 },
  head: { gap: space.s2 },
  title: { ...type.h2, color: color.textPrimary },
  subtitle: { ...type.bodySm, color: color.textSecondary },
  block: { gap: space.s3 },
  alert: {
    backgroundColor: color.errorSoft,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: color.error,
    padding: space.s3,
  },
  alertText: { ...type.bodySm, color: color.errorFg },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: space.s3,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: color.steel,
    backgroundColor: color.bgSurface,
  },
  optionActive: { borderColor: color.accentBorder, backgroundColor: color.accentSoft },
  optionLabel: { ...type.label, color: color.textPrimary },
  optionPrice: { ...type.label, color: color.textSecondary },
  attendeeCard: {
    gap: space.s3,
    padding: space.s3,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: color.borderFaint,
    backgroundColor: color.bgSurface,
  },
  attendeeTitle: { ...type.label, color: color.smoke, textTransform: 'uppercase' },
  methods: { flexDirection: 'row', gap: space.s2 },
  method: {
    flex: 1,
    alignItems: 'center',
    padding: space.s3,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: color.steel,
    backgroundColor: color.bgSurface,
  },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: space.s3,
    borderTopWidth: 1,
    borderTopColor: color.borderFaint,
  },
  summaryLabel: { ...type.body, color: color.textSecondary },
  summaryValue: { ...type.h3, color: color.textPrimary },
  successTicket: { alignItems: 'center', gap: space.s2 },
  attendee: { ...type.title, color: color.textPrimary },
});
