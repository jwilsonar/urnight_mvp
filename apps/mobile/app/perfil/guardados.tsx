import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { FadeIn, PressableScale } from '../../components/motion';
import { Screen } from '../../components/primitives';
import { EVENTOS_DEMO, type EventoDemo } from '../../lib/mock/eventos';
import { GUARDADOS_DEMO } from '../../lib/mock/perfil';
import { colors, radius, spacing, typography } from '../../lib/theme';

/**
 * Eventos guardados (favoritos). Estado local inicializado con
 * GUARDADOS_DEMO; quitar un favorito solo afecta el estado en memoria
 * (con backend, esto llamaría al módulo de favoritos del usuario).
 */
export default function GuardadosScreen() {
  const router = useRouter();
  const [guardados, setGuardados] = useState<EventoDemo[]>(() =>
    EVENTOS_DEMO.filter((e) => GUARDADOS_DEMO.includes(e.id)),
  );

  function quitar(id: string) {
    setGuardados((prev) => prev.filter((e) => e.id !== id));
  }

  if (guardados.length === 0) {
    return (
      <Screen scroll={false} style={styles.emptyScreen}>
        <FadeIn>
          <View style={styles.empty}>
            <Ionicons name="heart-outline" size={56} color={colors.textMuted} />
            <Text style={styles.emptyText}>Aún no guardas eventos</Text>
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel="Explorar eventos"
              onPress={() => router.replace('/(tabs)/explorar')}
              style={styles.emptyBtn}
            >
              <Text style={styles.emptyBtnText}>Explorar eventos</Text>
            </PressableScale>
          </View>
        </FadeIn>
      </Screen>
    );
  }

  return (
    <Screen>
      {guardados.map((evento, i) => (
        <FadeIn key={evento.id} delay={i * 50}>
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel={`Ver evento ${evento.nombre}`}
            onPress={() => router.push(`/evento/${evento.id}`)}
            style={styles.card}
          >
            <Image source={{ uri: evento.imageUrl }} style={styles.thumb} />
            <View style={{ flex: 1 }}>
              <Text style={styles.nombre} numberOfLines={1}>
                {evento.nombre}
              </Text>
              <Text style={styles.sub} numberOfLines={1}>
                {evento.local} · {evento.zona}
              </Text>
              <Text style={styles.fecha}>{evento.fechaLabel}</Text>
            </View>
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel={`Quitar ${evento.nombre} de guardados`}
              onPress={() => quitar(evento.id)}
              style={styles.heartBtn}
            >
              <Ionicons name="heart" size={22} color={colors.error} />
            </PressableScale>
          </PressableScale>
        </FadeIn>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: colors.bgSurface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  empty: { alignItems: 'center', gap: spacing.md },
  emptyBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  emptyBtnText: { color: colors.textPrimary, fontSize: typography.body, fontWeight: '700' },
  emptyScreen: { alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: colors.textMuted, fontSize: typography.body, fontWeight: '600' },
  fecha: { color: colors.textMuted, fontSize: typography.micro, marginTop: 2 },
  heartBtn: { padding: spacing.xs },
  nombre: { color: colors.textPrimary, fontSize: typography.body, fontWeight: '800' },
  sub: { color: colors.textSecondary, fontSize: typography.caption, marginTop: 2 },
  thumb: { borderRadius: radius.sm, height: 56, width: 56 },
});
