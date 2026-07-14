import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Image, StyleSheet, Text, View } from 'react-native';

import { FadeIn, PressableScale } from '../../components/motion';
import { Badge, Screen, SectionTitle } from '../../components/primitives';
import { EVENTOS_DEMO, LOCALES_DEMO } from '../../lib/mock/eventos';
import { absoluteFill, colors, radius, spacing, typography } from '../../lib/theme';

/** Descripción demo genérica según el tipo de local (mientras no hay backend). */
const DESCRIPCION_POR_TIPO: Record<string, string> = {
  Discoteca: 'Pista principal, buena coctelería y un line-up que no para. Ideal para bailar toda la noche.',
  Rooftop: 'Vista de la ciudad, ambiente al aire libre y coctelería de autor. Perfecto para el atardecer.',
  Karaoke: 'Salas privadas con gran catálogo de canciones. Ideal para grupos y celebraciones.',
};

/**
 * Detalle de local: hero, descripción demo y próximos eventos ahí mismo.
 * CTA a carta in-venue (si está habilitada) o a reserva de mesa.
 */
export default function LocalDetalleScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const local = LOCALES_DEMO.find((l) => l.slug === slug);

  if (!local) {
    return (
      <Screen scroll={false} style={styles.center}>
        <Text style={styles.notFound}>Local no encontrado</Text>
      </Screen>
    );
  }

  const descripcion =
    DESCRIPCION_POR_TIPO[local.tipo] ?? 'Un local aliado de UrNight con buena música y ambiente.';
  const eventosAqui = EVENTOS_DEMO.filter((e) => e.local === local.nombre);

  return (
    <>
      <Stack.Screen options={{ title: local.nombre }} />
      <Screen style={{ paddingTop: spacing.md }}>
        <FadeIn>
          <View style={styles.heroWrap}>
            <Image source={{ uri: local.imageUrl }} style={styles.hero} />
            <View style={styles.heroOverlay} />
            <View style={styles.heroBadges}>
              <Badge tone="muted">{local.tipo}</Badge>
              <Badge tone="muted">{local.zona}</Badge>
              {local.cartaHabilitada ? <Badge tone="success">Carta digital</Badge> : null}
            </View>
          </View>
        </FadeIn>

        <FadeIn delay={70}>
          <Text style={styles.title}>{local.nombre}</Text>
          <Text style={styles.desc}>{descripcion}</Text>
        </FadeIn>

        <SectionTitle hint={`${eventosAqui.length} eventos`}>Próximos eventos aquí</SectionTitle>
        {eventosAqui.length === 0 ? (
          <Text style={styles.emptyText}>Aún no hay eventos programados en este local.</Text>
        ) : (
          <View style={{ gap: spacing.md }}>
            {eventosAqui.map((evento, i) => (
              <FadeIn key={evento.id} delay={i * 50}>
                <PressableScale
                  onPress={() => router.push(`/evento/${evento.id}`)}
                  accessibilityRole="button"
                  accessibilityLabel={`Ver evento ${evento.nombre}`}
                  style={styles.row}
                >
                  <Image source={{ uri: evento.imageUrl }} style={styles.rowImg} />
                  <View style={styles.rowBody}>
                    <Text style={styles.rowName} numberOfLines={1}>
                      {evento.nombre}
                    </Text>
                    <Text style={styles.rowDate}>
                      {evento.fechaLabel} · {evento.horaLabel}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                </PressableScale>
              </FadeIn>
            ))}
          </View>
        )}

        <FadeIn delay={200}>
          <View style={styles.actions}>
            {local.cartaHabilitada ? (
              <PressableScale
                onPress={() => router.push('/(tabs)/carta')}
                accessibilityRole="button"
                accessibilityLabel="Ver la carta del local"
                style={styles.primaryBtn}
              >
                <Ionicons name="wine" size={18} color={colors.textPrimary} />
                <Text style={styles.primaryBtnText}>Ver carta del local</Text>
              </PressableScale>
            ) : null}
            <PressableScale
              onPress={() => router.push('/reserva')}
              accessibilityRole="button"
              accessibilityLabel="Reservar mesa"
              style={styles.secondaryBtn}
            >
              <Ionicons name="storefront" size={18} color={colors.textPrimary} />
              <Text style={styles.secondaryBtnText}>Reservar mesa</Text>
            </PressableScale>
          </View>
        </FadeIn>

        <FadeIn delay={240}>
          <Text style={styles.demoNote}>Demo: la carta y disponibilidad reales llegan con el backend.</Text>
        </FadeIn>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  actions: { gap: spacing.md, marginTop: spacing.xl },
  center: { alignItems: 'center', justifyContent: 'center' },
  demoNote: { color: colors.textMuted, fontSize: typography.micro, marginTop: spacing.lg, textAlign: 'center' },
  desc: { color: colors.textSecondary, fontSize: typography.body, lineHeight: 22, marginTop: spacing.sm },
  emptyText: { color: colors.textMuted, fontSize: typography.caption },
  hero: { ...absoluteFill, borderRadius: radius.lg },
  heroBadges: { bottom: spacing.md, flexDirection: 'row', gap: spacing.sm, left: spacing.md, position: 'absolute' },
  heroOverlay: { ...absoluteFill, backgroundColor: 'rgba(11, 11, 18, 0.35)' },
  heroWrap: { borderRadius: radius.lg, height: 240, overflow: 'hidden' },
  notFound: { color: colors.textMuted, fontSize: typography.body },
  primaryBtn: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    paddingVertical: spacing.lg,
  },
  primaryBtnText: { color: colors.textPrimary, fontSize: typography.body, fontWeight: '800' },
  row: {
    alignItems: 'center',
    backgroundColor: colors.bgSurface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  rowBody: { flex: 1, gap: 2 },
  rowDate: { color: colors.lavender, fontSize: typography.micro, fontWeight: '600' },
  rowImg: { borderRadius: radius.sm, height: 56, width: 56 },
  rowName: { color: colors.textPrimary, fontSize: typography.body, fontWeight: '700' },
  secondaryBtn: {
    alignItems: 'center',
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    paddingVertical: spacing.lg,
  },
  secondaryBtnText: { color: colors.textPrimary, fontSize: typography.body, fontWeight: '700' },
  title: { color: colors.textPrimary, fontSize: typography.display, fontWeight: '900', marginTop: spacing.lg },
});
