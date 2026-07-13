import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';

import { FadeIn, PressableScale } from '../../components/motion';
import { Badge, Chip, Screen, SectionTitle } from '../../components/primitives';
import { EVENTOS_DEMO, LOCALES_DEMO, type EventoDemo } from '../../lib/mock/eventos';
import { absoluteFill, colors, radius, spacing, typography } from '../../lib/theme';

const GENEROS = ['Todos', 'Reggaetón', 'House', 'Techno', 'Pop'];

/** Inicio: hero de destacados (scroll horizontal) + próximos + locales. */
export default function InicioScreen() {
  const router = useRouter();
  const [genero, setGenero] = useState('Todos');

  const eventos = useMemo(
    () =>
      genero === 'Todos'
        ? EVENTOS_DEMO
        : EVENTOS_DEMO.filter((e) => e.generos.includes(genero)),
    [genero],
  );
  const destacados = eventos.filter((e) => e.destacado);

  return (
    <Screen>
      <FadeIn>
        <Text style={styles.eyebrow}>TU NOCHE EMPIEZA AQUÍ</Text>
        <Text style={styles.title}>UrNight</Text>
      </FadeIn>

      {/* Filtro por género */}
      <FadeIn delay={60}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
          style={styles.chipScroll}
        >
          {GENEROS.map((g) => (
            <Chip key={g} label={g} active={genero === g} onPress={() => setGenero(g)} />
          ))}
        </ScrollView>
      </FadeIn>

      {/* Destacados */}
      <SectionTitle hint={`${destacados.length} eventos`}>Destacados</SectionTitle>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: spacing.md }}
        style={styles.heroScroll}
        snapToInterval={264}
        decelerationRate="fast"
      >
        {destacados.map((evento, i) => (
          <FadeIn key={evento.id} delay={i * 70}>
            <HeroCard evento={evento} onPress={() => router.push(`/evento/${evento.id}`)} />
          </FadeIn>
        ))}
      </ScrollView>

      {/* Próximos eventos */}
      <SectionTitle>Próximos eventos</SectionTitle>
      <View style={{ gap: spacing.md }}>
        {eventos.map((evento, i) => (
          <FadeIn key={evento.id} delay={i * 50}>
            <EventoRow evento={evento} onPress={() => router.push(`/evento/${evento.id}`)} />
          </FadeIn>
        ))}
      </View>

      {/* Locales */}
      <SectionTitle>Locales aliados</SectionTitle>
      <View style={styles.localGrid}>
        {LOCALES_DEMO.map((local, i) => (
          <FadeIn key={local.slug} delay={i * 50} style={styles.localCell}>
            <View style={styles.localCard}>
              <Image source={{ uri: local.imageUrl }} style={styles.localImg} />
              <View style={styles.localBody}>
                <Text style={styles.localName} numberOfLines={1}>
                  {local.nombre}
                </Text>
                <Text style={styles.localMeta}>
                  {local.tipo} · {local.zona}
                </Text>
              </View>
            </View>
          </FadeIn>
        ))}
      </View>
    </Screen>
  );
}

function HeroCard({ evento, onPress }: { evento: EventoDemo; onPress: () => void }) {
  return (
    <PressableScale onPress={onPress} accessibilityRole="button" style={styles.hero}>
      <Image source={{ uri: evento.imageUrl }} style={styles.heroImg} />
      <View style={styles.heroOverlay} />
      <View style={styles.heroBody}>
        {evento.precioDesdeSoles === null ? (
          <Badge tone="success">Entrada gratis</Badge>
        ) : (
          <Badge tone="accent">{`Desde S/ ${evento.precioDesdeSoles}`}</Badge>
        )}
        <Text style={styles.heroName} numberOfLines={2}>
          {evento.nombre}
        </Text>
        <Text style={styles.heroMeta}>
          {evento.local} · {evento.fechaLabel}
        </Text>
      </View>
    </PressableScale>
  );
}

function EventoRow({ evento, onPress }: { evento: EventoDemo; onPress: () => void }) {
  return (
    <PressableScale onPress={onPress} accessibilityRole="button" style={styles.row}>
      <Image source={{ uri: evento.imageUrl }} style={styles.rowImg} />
      <View style={styles.rowBody}>
        <Text style={styles.rowName} numberOfLines={1}>
          {evento.nombre}
        </Text>
        <Text style={styles.rowMeta} numberOfLines={1}>
          {evento.local} · {evento.zona}
        </Text>
        <Text style={styles.rowDate}>
          {evento.fechaLabel} · {evento.horaLabel}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  chipRow: { gap: spacing.sm },
  chipScroll: { marginTop: spacing.lg },
  eyebrow: {
    color: colors.lavender,
    fontSize: typography.micro,
    fontWeight: '700',
    letterSpacing: 2,
  },
  hero: {
    borderRadius: radius.lg,
    height: 300,
    overflow: 'hidden',
    width: 250,
  },
  heroBody: { bottom: 0, gap: spacing.xs, padding: spacing.lg, position: 'absolute' },
  heroImg: { ...absoluteFill, borderRadius: radius.lg },
  heroMeta: { color: colors.textSecondary, fontSize: typography.caption },
  heroName: { color: colors.textPrimary, fontSize: typography.title, fontWeight: '800' },
  heroOverlay: {
    ...absoluteFill,
    backgroundColor: 'rgba(11, 11, 18, 0.35)',
  },
  heroScroll: { marginHorizontal: -spacing.lg, paddingLeft: spacing.lg },
  localBody: { padding: spacing.md },
  localCard: {
    backgroundColor: colors.bgSurface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  localCell: { flexBasis: '48%', flexGrow: 1 },
  localGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  localImg: { height: 90, width: '100%' },
  localMeta: { color: colors.textMuted, fontSize: typography.micro, marginTop: 2 },
  localName: { color: colors.textPrimary, fontSize: typography.caption, fontWeight: '700' },
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
  rowMeta: { color: colors.textMuted, fontSize: typography.micro },
  rowName: { color: colors.textPrimary, fontSize: typography.body, fontWeight: '700' },
  title: { color: colors.textPrimary, fontSize: typography.display, fontWeight: '900' },
});
