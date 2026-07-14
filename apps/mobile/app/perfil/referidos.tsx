import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { FadeIn, PressableScale } from '../../components/motion';
import { Screen, SectionTitle } from '../../components/primitives';
import { REFERIDOS_DEMO } from '../../lib/mock/perfil';
import { colors, radius, spacing, typography } from '../../lib/theme';

/**
 * Programa de referidos: código propio (copia simulada, sin clipboard real),
 * progreso hacia la meta y lista de amigos invitados. Datos de
 * lib/mock/perfil.ts.
 */
export default function ReferidosScreen() {
  const [copiado, setCopiado] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const progreso = Math.round((REFERIDOS_DEMO.invitados / REFERIDOS_DEMO.meta) * 100);

  function handleCopiar() {
    setCopiado(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setCopiado(false), 1200);
  }

  return (
    <Screen>
      <FadeIn>
        <View style={styles.card}>
          <Text style={styles.eyebrow}>TU CÓDIGO</Text>
          <Text style={styles.codigo}>{REFERIDOS_DEMO.codigo}</Text>
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Copiar código de referido"
            onPress={handleCopiar}
            style={styles.copyBtn}
          >
            <Ionicons
              name={copiado ? 'checkmark' : 'copy-outline'}
              size={16}
              color={colors.textPrimary}
            />
            <Text style={styles.copyText}>{copiado ? '¡Copiado!' : 'Copiar código'}</Text>
          </PressableScale>
        </View>
      </FadeIn>

      <FadeIn delay={60}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>
              {REFERIDOS_DEMO.invitados} de {REFERIDOS_DEMO.meta} amigos
            </Text>
            <Text style={styles.cardPts}>{REFERIDOS_DEMO.puntos} pts</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progreso}%` }]} />
          </View>
          <Text style={styles.cardSub}>
            +30 pts por cada amigo que compra su primera entrada
          </Text>
        </View>
      </FadeIn>

      <SectionTitle>Tus referidos</SectionTitle>
      <View style={styles.list}>
        {REFERIDOS_DEMO.lista.map((amigo, i) => (
          <FadeIn key={amigo.nombre} delay={i * 50}>
            <View style={styles.row}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{amigo.nombre[0]}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.amigoNombre}>{amigo.nombre}</Text>
                <View style={styles.estadoRow}>
                  <Ionicons
                    name={amigo.completado ? 'checkmark-circle' : 'time'}
                    size={13}
                    color={amigo.completado ? colors.success : colors.textMuted}
                  />
                  <Text
                    style={[
                      styles.estadoText,
                      { color: amigo.completado ? colors.success : colors.textMuted },
                    ]}
                    numberOfLines={1}
                  >
                    {amigo.estado}
                  </Text>
                </View>
              </View>
              <Text style={styles.fecha}>{amigo.fechaLabel}</Text>
            </View>
          </FadeIn>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  amigoNombre: { color: colors.textPrimary, fontSize: typography.body, fontWeight: '700' },
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.accentSoft,
    borderRadius: radius.full,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  avatarText: { color: colors.lavender, fontSize: typography.body, fontWeight: '800' },
  card: {
    backgroundColor: colors.bgSurface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
    marginBottom: spacing.lg,
    padding: spacing.lg,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  cardPts: { color: colors.lavender, fontSize: typography.body, fontWeight: '800' },
  cardSub: { color: colors.textMuted, fontSize: typography.micro },
  cardTitle: { color: colors.textPrimary, fontSize: typography.body, fontWeight: '800' },
  codigo: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 2,
    marginTop: spacing.xs,
  },
  copyBtn: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    marginTop: spacing.md,
    paddingVertical: spacing.md,
  },
  copyText: { color: colors.textPrimary, fontSize: typography.body, fontWeight: '700' },
  estadoRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.xs, marginTop: 2 },
  estadoText: { flex: 1, fontSize: typography.caption },
  eyebrow: { color: colors.textMuted, fontSize: typography.micro, fontWeight: '700', letterSpacing: 1 },
  fecha: { color: colors.textMuted, fontSize: typography.micro },
  list: {
    backgroundColor: colors.bgSurface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  progressFill: { backgroundColor: colors.accent, borderRadius: radius.full, height: 8 },
  progressTrack: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.full,
    height: 8,
    overflow: 'hidden',
  },
  row: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
  },
});
