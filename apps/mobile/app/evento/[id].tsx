import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { FadeIn, PressableScale } from '../../components/motion';
import { Badge, Screen } from '../../components/primitives';
import { eventoById } from '../../lib/mock/eventos';
import { absoluteFill, colors, radius, spacing, typography } from '../../lib/theme';

/**
 * Detalle de evento: flyer, info y CTA de canje/compra demo. Con backend, el
 * canje crea la entrada real (QR único) vía módulo de ticketing.
 */
export default function EventoDetalleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const evento = eventoById(id ?? '');
  const [canjeado, setCanjeado] = useState(false);

  if (!evento) {
    return (
      <Screen scroll={false} style={styles.center}>
        <Text style={styles.notFound}>Evento no encontrado</Text>
      </Screen>
    );
  }

  const esGratis = evento.precioDesdeSoles === null;

  return (
    <>
      <Stack.Screen options={{ title: evento.local }} />
      <Screen style={{ paddingTop: spacing.md }}>
        <FadeIn>
          <View style={styles.flyerWrap}>
            <Image source={{ uri: evento.imageUrl }} style={styles.flyer} />
            <View style={styles.flyerOverlay} />
            <View style={styles.flyerBadges}>
              {esGratis ? (
                <Badge tone="success">Entrada gratis · vía promotor</Badge>
              ) : (
                <Badge tone="accent">{`Desde S/ ${evento.precioDesdeSoles}`}</Badge>
              )}
            </View>
          </View>
        </FadeIn>

        <FadeIn delay={70}>
          <Text style={styles.title}>{evento.nombre}</Text>
          <View style={styles.metaRow}>
            <Meta icon="business" text={`${evento.local} · ${evento.zona}`} />
            <Meta icon="calendar" text={`${evento.fechaLabel} · ${evento.horaLabel}`} />
            <Meta icon="shirt" text={`Dress code: ${evento.dressCode}`} />
            <Meta icon="musical-notes" text={evento.generos.join(' · ')} />
          </View>
        </FadeIn>

        <FadeIn delay={130}>
          <Text style={styles.desc}>{evento.descripcion}</Text>
        </FadeIn>

        <FadeIn delay={180}>
          {canjeado ? (
            <View style={styles.okBox}>
              <Ionicons name="checkmark-circle" size={22} color={colors.success} />
              <View style={{ flex: 1 }}>
                <Text style={styles.okTitle}>¡Entrada canjeada!</Text>
                <Text style={styles.okSub}>Tu QR ya está en la pestaña Entradas.</Text>
              </View>
              <PressableScale
                onPress={() => router.push('/entradas')}
                accessibilityRole="button"
                style={styles.okBtn}
              >
                <Text style={styles.okBtnText}>Ver QR</Text>
              </PressableScale>
            </View>
          ) : (
            <PressableScale
              onPress={() => setCanjeado(true)}
              accessibilityRole="button"
              style={styles.cta}
            >
              <Ionicons name="ticket" size={20} color={colors.textPrimary} />
              <Text style={styles.ctaText}>
                {esGratis ? 'Canjear entrada gratis (demo)' : 'Comprar entrada (demo)'}
              </Text>
            </PressableScale>
          )}
        </FadeIn>

        <FadeIn delay={230}>
          <Text style={styles.demoNote}>
            Demo: el canje real valida el código del promotor y emite tu QR único (+18).
          </Text>
        </FadeIn>
      </Screen>
    </>
  );
}

function Meta({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={styles.meta}>
      <Ionicons name={icon} size={14} color={colors.lavender} />
      <Text style={styles.metaText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  cta: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    marginTop: spacing.xl,
    paddingVertical: spacing.lg,
  },
  ctaText: { color: colors.textPrimary, fontSize: typography.body, fontWeight: '800' },
  demoNote: {
    color: colors.textMuted,
    fontSize: typography.micro,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  desc: {
    color: colors.textSecondary,
    fontSize: typography.body,
    lineHeight: 22,
    marginTop: spacing.lg,
  },
  flyer: { height: 320, width: '100%' },
  flyerBadges: { bottom: spacing.md, left: spacing.md, position: 'absolute' },
  flyerOverlay: {
    ...absoluteFill,
    backgroundColor: 'rgba(11, 11, 18, 0.2)',
  },
  flyerWrap: { borderRadius: radius.lg, overflow: 'hidden' },
  meta: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  metaRow: { gap: spacing.sm, marginTop: spacing.md },
  metaText: { color: colors.textSecondary, fontSize: typography.caption },
  notFound: { color: colors.textMuted, fontSize: typography.body },
  okBox: {
    alignItems: 'center',
    backgroundColor: colors.successSoft,
    borderColor: colors.success,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
    padding: spacing.lg,
  },
  okBtn: {
    backgroundColor: colors.success,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  okBtnText: { color: colors.midnight, fontSize: typography.caption, fontWeight: '800' },
  okSub: { color: colors.textSecondary, fontSize: typography.micro },
  okTitle: { color: colors.textPrimary, fontSize: typography.body, fontWeight: '800' },
  title: {
    color: colors.textPrimary,
    fontSize: typography.display,
    fontWeight: '900',
    marginTop: spacing.lg,
  },
});
