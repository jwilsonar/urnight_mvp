import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { FadeIn, PressableScale } from '../../components/motion';
import { Screen } from '../../components/primitives';
import { formatSoles } from '../../lib/mock/carta';
import { eventoById } from '../../lib/mock/eventos';
import { colors, radius, spacing, typography } from '../../lib/theme';

type Tipo = 'general' | 'vip';

const SERVICIO_PCT = 0.1;

/**
 * Compra demo de entradas. Sin backend: no hay pasarela ni wallet real, solo
 * simula el cálculo de precios y el estado de éxito.
 */
export default function CheckoutScreen() {
  const { eventoId } = useLocalSearchParams<{ eventoId: string }>();
  const router = useRouter();
  const evento = eventoById(eventoId ?? '');

  const [tipo, setTipo] = useState<Tipo>('general');
  const [cantidad, setCantidad] = useState(1);
  const [pagado, setPagado] = useState(false);

  const precioBase = evento?.precioDesdeSoles ?? 0;

  const { subtotal, servicio, total } = useMemo(() => {
    const precioUnit = tipo === 'vip' ? precioBase * 2 : precioBase;
    const sub = precioUnit * cantidad;
    const serv = sub * SERVICIO_PCT;
    return { subtotal: sub, servicio: serv, total: sub + serv };
  }, [tipo, cantidad, precioBase]);

  if (!evento) {
    return (
      <Screen scroll={false} style={styles.center}>
        <Text style={styles.notFound}>Evento no encontrado</Text>
      </Screen>
    );
  }

  if (evento.precioDesdeSoles === null) {
    return (
      <Screen scroll={false} style={styles.center}>
        <FadeIn style={styles.avisoBox}>
          <Ionicons name="information-circle" size={28} color={colors.info} />
          <Text style={styles.avisoText}>Este evento es de entrada gratuita.</Text>
          <PressableScale
            onPress={() => router.replace(`/canje/${evento.id}`)}
            accessibilityRole="button"
            accessibilityLabel="Canjear con código"
            style={styles.primaryBtn}
          >
            <Text style={styles.primaryBtnText}>Canjear con código</Text>
          </PressableScale>
        </FadeIn>
      </Screen>
    );
  }

  if (pagado) {
    return (
      <Screen scroll={false} style={styles.confirmScreen}>
        <FadeIn style={styles.confirmCard}>
          <Ionicons name="checkmark-circle" size={48} color={colors.success} />
          <Text style={styles.confirmTitle}>¡Compra realizada!</Text>
          <Text style={styles.confirmSub}>
            El pago real llega con la pasarela + wallet UrNight.
          </Text>
        </FadeIn>
        <FadeIn delay={120}>
          <PressableScale
            onPress={() => router.replace('/(tabs)/entradas')}
            accessibilityRole="button"
            accessibilityLabel="Ver mis entradas"
            style={styles.primaryBtn}
          >
            <Text style={styles.primaryBtnText}>Ver mis entradas</Text>
          </PressableScale>
        </FadeIn>
      </Screen>
    );
  }

  return (
    <Screen>
      <FadeIn>
        <Text style={styles.title}>{evento.nombre}</Text>
        <Text style={styles.subtitle}>
          {evento.local} · {evento.fechaLabel}
        </Text>
      </FadeIn>

      {/* Selector de tipo de entrada */}
      <FadeIn delay={60}>
        <View style={styles.tipoRow}>
          <TipoCard
            label="General"
            precio={precioBase}
            active={tipo === 'general'}
            onPress={() => setTipo('general')}
          />
          <TipoCard
            label="VIP"
            precio={precioBase * 2}
            hint="Incluye cola preferente"
            active={tipo === 'vip'}
            onPress={() => setTipo('vip')}
          />
        </View>
      </FadeIn>

      {/* Cantidad */}
      <FadeIn delay={110}>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Cantidad</Text>
          <View style={styles.stepper}>
            <PressableScale
              onPress={() => setCantidad((c) => Math.max(1, c - 1))}
              accessibilityRole="button"
              accessibilityLabel="Restar entrada"
              style={styles.stepBtn}
            >
              <Ionicons name="remove" size={18} color={colors.lavender} />
            </PressableScale>
            <Text style={styles.stepQty}>{cantidad}</Text>
            <PressableScale
              onPress={() => setCantidad((c) => Math.min(6, c + 1))}
              accessibilityRole="button"
              accessibilityLabel="Sumar entrada"
              style={styles.stepBtn}
            >
              <Ionicons name="add" size={18} color={colors.lavender} />
            </PressableScale>
          </View>
        </View>
      </FadeIn>

      {/* Resumen */}
      <FadeIn delay={160}>
        <View style={styles.card}>
          <View style={styles.resumenRow}>
            <Text style={styles.resumenLabel}>Subtotal</Text>
            <Text style={styles.resumenValue}>{formatSoles(subtotal)}</Text>
          </View>
          <View style={styles.resumenRow}>
            <Text style={styles.resumenLabel}>Servicio UrNight (10%)</Text>
            <Text style={styles.resumenValue}>{formatSoles(servicio)}</Text>
          </View>
          <View style={[styles.resumenRow, styles.resumenTotalRow]}>
            <Text style={styles.resumenTotalLabel}>Total</Text>
            <Text style={styles.resumenTotalValue}>{formatSoles(total)}</Text>
          </View>
        </View>
      </FadeIn>

      <FadeIn delay={210}>
        <PressableScale
          onPress={() => setPagado(true)}
          accessibilityRole="button"
          accessibilityLabel={`Pagar ${formatSoles(total)} (demo)`}
          style={styles.primaryBtn}
        >
          <Text style={styles.primaryBtnText}>{`Pagar ${formatSoles(total)} (demo)`}</Text>
        </PressableScale>
      </FadeIn>

      <FadeIn delay={250}>
        <Text style={styles.demoNote}>
          Demo: el pago real llega con la pasarela + wallet UrNight.
        </Text>
      </FadeIn>
    </Screen>
  );
}

function TipoCard({
  label,
  precio,
  hint,
  active,
  onPress,
}: {
  label: string;
  precio: number;
  hint?: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Entrada ${label}, ${formatSoles(precio)}`}
      accessibilityState={{ selected: active }}
      style={[styles.tipoCard, active ? styles.tipoCardActive : null]}
    >
      <Text style={styles.tipoLabel}>{label}</Text>
      <Text style={styles.tipoPrecio}>{formatSoles(precio)}</Text>
      {hint ? <Text style={styles.tipoHint}>{hint}</Text> : null}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  avisoBox: {
    alignItems: 'center',
    backgroundColor: colors.infoSoft,
    borderColor: colors.info,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.xxl,
  },
  avisoText: { color: colors.textPrimary, fontSize: typography.body, fontWeight: '700', textAlign: 'center' },
  card: {
    backgroundColor: colors.bgSurface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.md,
    marginTop: spacing.lg,
    padding: spacing.lg,
  },
  cardLabel: { color: colors.textPrimary, fontSize: typography.body, fontWeight: '700' },
  center: { alignItems: 'center', justifyContent: 'center' },
  confirmCard: {
    alignItems: 'center',
    backgroundColor: colors.bgSurface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.xxl,
  },
  confirmScreen: { gap: spacing.xl, justifyContent: 'center' },
  confirmSub: { color: colors.textSecondary, fontSize: typography.caption, textAlign: 'center' },
  confirmTitle: { color: colors.textPrimary, fontSize: typography.title, fontWeight: '800' },
  demoNote: { color: colors.textMuted, fontSize: typography.micro, marginTop: spacing.lg, textAlign: 'center' },
  notFound: { color: colors.textMuted, fontSize: typography.body },
  primaryBtn: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    justifyContent: 'center',
    marginTop: spacing.xl,
    paddingVertical: spacing.lg,
  },
  primaryBtnText: { color: colors.textPrimary, fontSize: typography.body, fontWeight: '800' },
  resumenLabel: { color: colors.textSecondary, fontSize: typography.caption },
  resumenRow: { flexDirection: 'row', justifyContent: 'space-between' },
  resumenTotalLabel: { color: colors.textPrimary, fontSize: typography.body, fontWeight: '800' },
  resumenTotalRow: {
    borderTopColor: colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: spacing.sm,
  },
  resumenTotalValue: {
    color: colors.textPrimary,
    fontSize: typography.body,
    fontVariant: ['tabular-nums'],
    fontWeight: '800',
  },
  resumenValue: { color: colors.textPrimary, fontSize: typography.caption, fontVariant: ['tabular-nums'] },
  stepBtn: {
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderRadius: radius.full,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  stepper: { alignItems: 'center', flexDirection: 'row', gap: spacing.lg },
  stepQty: { color: colors.textPrimary, fontSize: typography.body, fontWeight: '800', minWidth: 20, textAlign: 'center' },
  subtitle: { color: colors.textMuted, fontSize: typography.caption, marginTop: spacing.xs },
  tipoCard: {
    backgroundColor: colors.bgSurface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flex: 1,
    gap: 2,
    padding: spacing.lg,
  },
  tipoCardActive: { backgroundColor: colors.accentSoft, borderColor: colors.accent },
  tipoHint: { color: colors.lavender, fontSize: typography.micro, marginTop: spacing.xs },
  tipoLabel: { color: colors.textPrimary, fontSize: typography.body, fontWeight: '800' },
  tipoPrecio: { color: colors.textSecondary, fontSize: typography.caption },
  tipoRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  title: { color: colors.textPrimary, fontSize: typography.display, fontWeight: '900' },
});
