import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { FadeIn } from '../../components/motion';
import { Badge, Screen, SectionTitle } from '../../components/primitives';
import { BADGES_DEMO, NIVEL_DEMO } from '../../lib/mock/perfil';
import { colors, radius, spacing, typography } from '../../lib/theme';

/**
 * Niveles y badges: progreso hacia el siguiente nivel + escalera completa +
 * grid de insignias (bloqueadas con candado). Datos de lib/mock/perfil.ts.
 */

const ESCALERA = [
  { nombre: 'Bronce', meta: 0 },
  { nombre: 'Plata', meta: 500 },
  { nombre: 'Oro', meta: 1200 },
  { nombre: 'Diamante', meta: 2000 },
];

const unlockedCount = BADGES_DEMO.filter((b) => b.unlocked).length;

export default function NivelesScreen() {
  const progreso = Math.min(
    100,
    Math.round((NIVEL_DEMO.puntos / NIVEL_DEMO.puntosSiguiente) * 100),
  );
  const faltan = NIVEL_DEMO.puntosSiguiente - NIVEL_DEMO.puntos;

  return (
    <Screen>
      <FadeIn>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Nivel {NIVEL_DEMO.actual}</Text>
            <Text style={styles.cardPts}>
              {NIVEL_DEMO.puntos} / {NIVEL_DEMO.puntosSiguiente} pts
            </Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progreso}%` }]} />
          </View>
          <Text style={styles.cardSub}>
            {faltan} pts para nivel {NIVEL_DEMO.siguiente}
          </Text>
        </View>
      </FadeIn>

      <SectionTitle>Escalera de niveles</SectionTitle>
      <View style={styles.escalera}>
        {ESCALERA.map((nivel, i) => {
          const esActual = nivel.nombre === NIVEL_DEMO.actual;
          return (
            <FadeIn key={nivel.nombre} delay={i * 50}>
              <View style={[styles.nivelRow, esActual ? styles.nivelRowActual : null]}>
                <Ionicons
                  name="medal"
                  size={22}
                  color={esActual ? colors.lavender : colors.textMuted}
                />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.nivelNombre, esActual ? styles.nivelNombreActual : null]}>
                    {nivel.nombre}
                  </Text>
                  <Text style={styles.nivelMeta}>{nivel.meta} pts</Text>
                </View>
                {esActual ? <Badge tone="accent">Tu nivel</Badge> : null}
              </View>
            </FadeIn>
          );
        })}
      </View>

      <SectionTitle hint={`${unlockedCount} de ${BADGES_DEMO.length}`}>Insignias</SectionTitle>
      <View style={styles.badgeGrid}>
        {BADGES_DEMO.map((badge, i) => (
          <FadeIn key={badge.nombre} delay={i * 40} style={styles.badgeCell}>
            <View style={[styles.badgeCard, !badge.unlocked ? styles.badgeCardLocked : null]}>
              {!badge.unlocked ? (
                <View style={styles.lockIcon}>
                  <Ionicons name="lock-closed" size={12} color={colors.textMuted} />
                </View>
              ) : null}
              <Text style={styles.badgeIcon}>{badge.icono}</Text>
              <Text style={styles.badgeNombre} numberOfLines={2}>
                {badge.nombre}
              </Text>
              <Text style={styles.badgeCriterio} numberOfLines={2}>
                {badge.criterio}
              </Text>
            </View>
          </FadeIn>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  badgeCard: {
    alignItems: 'center',
    backgroundColor: colors.bgSurface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.md,
  },
  badgeCardLocked: { opacity: 0.4 },
  badgeCell: { flexBasis: '31%', flexGrow: 1 },
  badgeCriterio: { color: colors.textMuted, fontSize: typography.micro, textAlign: 'center' },
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  badgeIcon: { fontSize: 28 },
  badgeNombre: {
    color: colors.textSecondary,
    fontSize: typography.caption,
    fontWeight: '700',
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.bgSurface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  cardPts: { color: colors.textMuted, fontSize: typography.caption },
  cardSub: { color: colors.textMuted, fontSize: typography.micro },
  cardTitle: { color: colors.textPrimary, fontSize: typography.heading, fontWeight: '800' },
  escalera: {
    backgroundColor: colors.bgSurface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.sm,
  },
  lockIcon: { position: 'absolute', right: spacing.xs, top: spacing.xs },
  nivelMeta: { color: colors.textMuted, fontSize: typography.micro },
  nivelNombre: { color: colors.textSecondary, fontSize: typography.body, fontWeight: '700' },
  nivelNombreActual: { color: colors.textPrimary },
  nivelRow: {
    alignItems: 'center',
    borderRadius: radius.sm,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  nivelRowActual: { borderColor: colors.accent, borderWidth: 1 },
  progressFill: { backgroundColor: colors.accent, borderRadius: radius.full, height: 8 },
  progressTrack: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.full,
    height: 8,
    overflow: 'hidden',
  },
});
