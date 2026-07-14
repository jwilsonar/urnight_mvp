import { StyleSheet, Text, View } from 'react-native';

import { FadeIn } from '../../components/motion';
import { Screen, SectionTitle } from '../../components/primitives';
import { MOVIMIENTOS_DEMO, WALLET_DEMO } from '../../lib/mock/perfil';
import { colors, radius, spacing, typography } from '../../lib/theme';

/**
 * Wallet UrNight: saldo demo + historial de movimientos. Recarga y canje de
 * puntos quedan deshabilitados hasta integrar la pasarela de pagos + módulo
 * de wallet real.
 */
export default function WalletScreen() {
  return (
    <Screen>
      <FadeIn>
        <View style={styles.card}>
          <Text style={styles.label}>SALDO DISPONIBLE</Text>
          <Text style={styles.saldo}>{WALLET_DEMO.saldo}</Text>
          <Text style={styles.equivalencia}>{WALLET_DEMO.equivalencia}</Text>
        </View>
      </FadeIn>

      <FadeIn delay={60}>
        <View style={styles.actions}>
          <View style={[styles.actionBtn, styles.actionDisabled]}>
            <Text style={styles.actionText}>Recargar</Text>
          </View>
          <View style={[styles.actionBtn, styles.actionDisabled]}>
            <Text style={styles.actionText}>Canjear puntos</Text>
          </View>
        </View>
        <Text style={styles.demoNote}>Demo: recargas y canjes llegan con la pasarela + wallet.</Text>
      </FadeIn>

      <SectionTitle>Movimientos</SectionTitle>
      <View style={styles.list}>
        {MOVIMIENTOS_DEMO.map((mov, i) => (
          <FadeIn key={`${mov.fechaLabel}-${i}`} delay={i * 50}>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.concepto} numberOfLines={2}>
                  {mov.concepto}
                </Text>
                <Text style={styles.fecha}>{mov.fechaLabel}</Text>
              </View>
              <Text style={[styles.monto, mov.tipo === 'in' ? styles.montoIn : styles.montoOut]}>
                {mov.monto}
              </Text>
            </View>
          </FadeIn>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  actionBtn: {
    alignItems: 'center',
    backgroundColor: colors.bgSurface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flex: 1,
    paddingVertical: spacing.md,
  },
  actionDisabled: { opacity: 0.5 },
  actionText: { color: colors.textPrimary, fontSize: typography.body, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  card: {
    alignItems: 'center',
    backgroundColor: colors.bgSurface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingVertical: spacing.xxl,
  },
  concepto: { color: colors.textPrimary, fontSize: typography.body, fontWeight: '600' },
  demoNote: {
    color: colors.textMuted,
    fontSize: typography.micro,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  equivalencia: { color: colors.textMuted, fontSize: typography.caption, marginTop: spacing.sm },
  fecha: { color: colors.textMuted, fontSize: typography.micro, marginTop: 2 },
  label: { color: colors.textMuted, fontSize: typography.micro, fontWeight: '700', letterSpacing: 1 },
  list: {
    backgroundColor: colors.bgSurface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  monto: { fontSize: typography.body, fontVariant: ['tabular-nums'], fontWeight: '800' },
  montoIn: { color: colors.success },
  montoOut: { color: colors.textPrimary },
  row: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
  },
  saldo: { color: colors.lavender, fontSize: 40, fontWeight: '900', marginTop: spacing.xs },
});
