import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { FadeIn, PressableScale } from '../../components/motion';
import { Badge, Chip, Screen } from '../../components/primitives';
import {
  EVENTOS_DEMO,
  LOCALES_DEMO,
  type EventoDemo,
  type LocalDemo,
} from '../../lib/mock/eventos';
import { colors, radius, spacing, typography } from '../../lib/theme';

const GENEROS = ['Todos', 'Reggaetón', 'House', 'Techno', 'Pop'];
const ZONAS = ['Todas', 'Miraflores', 'Barranco', 'San Isidro', 'Surco'];

/** Explorar: eventos o locales, con búsqueda y filtros por chip. */
export default function ExplorarScreen() {
  const router = useRouter();
  const [modo, setModo] = useState<'eventos' | 'locales'>('eventos');
  const [query, setQuery] = useState('');
  const [genero, setGenero] = useState('Todos');
  const [zona, setZona] = useState('Todas');

  const eventos = useMemo(() => {
    const q = query.trim().toLowerCase();
    return EVENTOS_DEMO.filter((e) => {
      const matchGenero = genero === 'Todos' || e.generos.includes(genero);
      const matchQuery =
        !q || e.nombre.toLowerCase().includes(q) || e.local.toLowerCase().includes(q);
      return matchGenero && matchQuery;
    });
  }, [genero, query]);

  const locales = useMemo(() => {
    const q = query.trim().toLowerCase();
    return LOCALES_DEMO.filter((l) => {
      const matchZona = zona === 'Todas' || l.zona === zona;
      const matchQuery = !q || l.nombre.toLowerCase().includes(q);
      return matchZona && matchQuery;
    });
  }, [zona, query]);

  return (
    <Screen>
      <FadeIn>
        <Text style={styles.title}>Explorar</Text>
      </FadeIn>

      {/* Toggle Eventos / Locales */}
      <FadeIn delay={50}>
        <View style={styles.toggle}>
          <PressableScale
            onPress={() => setModo('eventos')}
            accessibilityRole="button"
            accessibilityLabel="Ver eventos"
            accessibilityState={{ selected: modo === 'eventos' }}
            style={[styles.toggleBtn, modo === 'eventos' ? styles.toggleBtnActive : null]}
          >
            <Text
              style={[styles.toggleText, modo === 'eventos' ? styles.toggleTextActive : null]}
            >
              Eventos
            </Text>
          </PressableScale>
          <PressableScale
            onPress={() => setModo('locales')}
            accessibilityRole="button"
            accessibilityLabel="Ver locales"
            accessibilityState={{ selected: modo === 'locales' }}
            style={[styles.toggleBtn, modo === 'locales' ? styles.toggleBtnActive : null]}
          >
            <Text
              style={[styles.toggleText, modo === 'locales' ? styles.toggleTextActive : null]}
            >
              Locales
            </Text>
          </PressableScale>
        </View>
      </FadeIn>

      {/* Búsqueda */}
      <FadeIn delay={90}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={modo === 'eventos' ? 'Busca un evento o local' : 'Busca un local'}
            placeholderTextColor={colors.textMuted}
            style={styles.searchInput}
            accessibilityLabel={modo === 'eventos' ? 'Buscar eventos' : 'Buscar locales'}
          />
        </View>
      </FadeIn>

      {modo === 'eventos' ? (
        <>
          <FadeIn delay={120}>
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

          {eventos.length === 0 ? (
            <EmptyState texto="No encontramos eventos con esos filtros. Prueba con otra búsqueda." />
          ) : (
            <View style={styles.eventList}>
              {eventos.map((evento, i) => (
                <FadeIn key={evento.id} delay={i * 50}>
                  <EventoCard
                    evento={evento}
                    onPress={() => router.push(`/evento/${evento.id}`)}
                  />
                </FadeIn>
              ))}
            </View>
          )}
        </>
      ) : (
        <>
          <FadeIn delay={120}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
              style={styles.chipScroll}
            >
              {ZONAS.map((z) => (
                <Chip key={z} label={z} active={zona === z} onPress={() => setZona(z)} />
              ))}
            </ScrollView>
          </FadeIn>

          {locales.length === 0 ? (
            <EmptyState texto="No encontramos locales con esos filtros. Prueba con otra zona." />
          ) : (
            <View style={styles.localGrid}>
              {locales.map((local, i) => (
                <FadeIn key={local.slug} delay={i * 50} style={styles.localCell}>
                  <LocalCard local={local} onPress={() => router.push(`/local/${local.slug}`)} />
                </FadeIn>
              ))}
            </View>
          )}
        </>
      )}
    </Screen>
  );
}

function EmptyState({ texto }: { texto: string }) {
  return (
    <View style={styles.empty}>
      <Ionicons name="search-outline" size={28} color={colors.textMuted} />
      <Text style={styles.emptyText}>{texto}</Text>
    </View>
  );
}

function EventoCard({ evento, onPress }: { evento: EventoDemo; onPress: () => void }) {
  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Ver evento ${evento.nombre}`}
      style={styles.eventRow}
    >
      <Image source={{ uri: evento.imageUrl }} style={styles.eventImg} />
      <View style={styles.eventBody}>
        <Text style={styles.eventName} numberOfLines={1}>
          {evento.nombre}
        </Text>
        <Text style={styles.eventMeta} numberOfLines={1}>
          {evento.local} · {evento.zona}
        </Text>
        <Text style={styles.eventDate}>
          {evento.fechaLabel} · {evento.horaLabel}
        </Text>
      </View>
      {evento.precioDesdeSoles === null ? (
        <Badge tone="success">Gratis</Badge>
      ) : (
        <Badge tone="accent">{`S/ ${evento.precioDesdeSoles}`}</Badge>
      )}
    </PressableScale>
  );
}

function LocalCard({ local, onPress }: { local: LocalDemo; onPress: () => void }) {
  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Ver local ${local.nombre}`}
      style={styles.localCard}
    >
      <Image source={{ uri: local.imageUrl }} style={styles.localImg} />
      <View style={styles.localBody}>
        <Text style={styles.localName} numberOfLines={1}>
          {local.nombre}
        </Text>
        <Text style={styles.localMeta}>
          {local.tipo} · {local.zona}
        </Text>
        {local.cartaHabilitada ? <Badge tone="success">Carta digital</Badge> : null}
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  chipRow: { gap: spacing.sm },
  chipScroll: { marginTop: spacing.lg },
  empty: {
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: typography.body,
    paddingHorizontal: spacing.xl,
    textAlign: 'center',
  },
  eventBody: { flex: 1, gap: 2 },
  eventDate: { color: colors.lavender, fontSize: typography.micro, fontWeight: '600' },
  eventImg: { borderRadius: radius.sm, height: 56, width: 56 },
  eventList: { gap: spacing.md, marginTop: spacing.lg },
  eventMeta: { color: colors.textMuted, fontSize: typography.micro },
  eventName: { color: colors.textPrimary, fontSize: typography.body, fontWeight: '700' },
  eventRow: {
    alignItems: 'center',
    backgroundColor: colors.bgSurface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  localBody: { gap: spacing.xs, padding: spacing.md },
  localCard: {
    backgroundColor: colors.bgSurface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  localCell: { flexBasis: '48%', flexGrow: 1 },
  localGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.lg },
  localImg: { height: 90, width: '100%' },
  localMeta: { color: colors.textMuted, fontSize: typography.micro },
  localName: { color: colors.textPrimary, fontSize: typography.caption, fontWeight: '700' },
  searchBox: {
    alignItems: 'center',
    backgroundColor: colors.bgSurface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  searchInput: { color: colors.textPrimary, flex: 1, fontSize: typography.body, padding: 0 },
  title: { color: colors.textPrimary, fontSize: typography.display, fontWeight: '900' },
  toggle: {
    backgroundColor: colors.bgSurface,
    borderColor: colors.border,
    borderRadius: radius.full,
    borderWidth: 1,
    flexDirection: 'row',
    marginTop: spacing.lg,
    padding: 4,
  },
  toggleBtn: {
    alignItems: 'center',
    borderRadius: radius.full,
    flex: 1,
    paddingVertical: spacing.sm + 2,
  },
  toggleBtnActive: { backgroundColor: colors.accent },
  toggleText: { color: colors.textMuted, fontSize: typography.body, fontWeight: '700' },
  toggleTextActive: { color: colors.textPrimary },
});
