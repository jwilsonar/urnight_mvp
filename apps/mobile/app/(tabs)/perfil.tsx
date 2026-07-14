import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { FadeIn, PressableScale } from '../../components/motion';
import { Badge, Screen, SectionTitle } from '../../components/primitives';
import { useSession } from '../../lib/session';
import { colors, radius, spacing, typography } from '../../lib/theme';

/**
 * Perfil demo: identidad, nivel de fidelización y wallet (mismos valores que
 * los mocks web de lib/mock/fidelizacion.ts para contar una sola historia).
 * Con backend: sesión real (SecureStore como apps/validator) + fetchers.
 */

const NIVEL = { actual: 'Oro', puntos: 1240, siguiente: 'Diamante', meta: 2000 };
const WALLET_SALDO = 'S/ 184.50';

const BADGES = [
  { icono: '🎟️', nombre: 'Primera vez' },
  { icono: '🥂', nombre: 'Reserva VIP' },
  { icono: '🌃', nombre: '10 noches en Barranco' },
  { icono: '🌅', nombre: 'Madrugador' },
];

const MENU = [
  { icon: 'ticket' as const, label: 'Mis entradas', href: '/(tabs)/entradas' as const },
  { icon: 'heart' as const, label: 'Guardados', href: '/perfil/guardados' as const },
  { icon: 'people' as const, label: 'Programa de referidos', href: '/perfil/referidos' as const },
  { icon: 'notifications' as const, label: 'Notificaciones', href: '/perfil/notificaciones' as const },
  { icon: 'storefront' as const, label: 'Reservar mesa', href: '/reserva' as const },
];

export default function PerfilScreen() {
  const router = useRouter();
  const { user, signOut } = useSession();
  const progreso = Math.round((NIVEL.puntos / NIVEL.meta) * 100);

  const iniciales = (user?.name ?? 'U N')
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <Screen>
      <FadeIn>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{iniciales}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{user?.name ?? 'Invitado'}</Text>
            <Text style={styles.email}>{user?.email ?? ''}</Text>
          </View>
          <Badge tone="warning">{NIVEL.actual}</Badge>
        </View>
      </FadeIn>

      {/* Nivel → detalle de niveles e insignias */}
      <FadeIn delay={60}>
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel="Ver niveles y badges"
          onPress={() => router.push('/perfil/niveles')}
          style={styles.card}
        >
          <View style={styles.cardRow}>
            <Text style={styles.cardTitle}>Nivel {NIVEL.actual}</Text>
            <Text style={styles.cardHint}>
              {NIVEL.puntos} / {NIVEL.meta} pts
            </Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progreso}%` }]} />
          </View>
          <Text style={styles.cardSub}>
            {NIVEL.meta - NIVEL.puntos} pts para nivel {NIVEL.siguiente} · toca para ver más
          </Text>
        </PressableScale>
      </FadeIn>

      {/* Wallet → movimientos */}
      <FadeIn delay={110}>
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel="Ver wallet y movimientos"
          onPress={() => router.push('/perfil/wallet')}
          style={[styles.card, styles.walletCard]}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.walletLabel}>Wallet UrNight</Text>
            <Text style={styles.walletSaldo}>{WALLET_SALDO}</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </PressableScale>
      </FadeIn>

      {/* Insignias */}
      <SectionTitle hint="4 de 12">Insignias</SectionTitle>
      <View style={styles.badgeRow}>
        {BADGES.map((b, i) => (
          <FadeIn key={b.nombre} delay={i * 50} style={styles.badgeCell}>
            <View style={styles.badgeCard}>
              <Text style={styles.badgeIcon}>{b.icono}</Text>
              <Text style={styles.badgeName} numberOfLines={2}>
                {b.nombre}
              </Text>
            </View>
          </FadeIn>
        ))}
      </View>

      {/* Menú */}
      <SectionTitle>Cuenta</SectionTitle>
      <View style={styles.menu}>
        {MENU.map((item) => (
          <PressableScale
            key={item.label}
            accessibilityRole="button"
            onPress={() => router.push(item.href)}
            style={styles.menuItem}
          >
            <Ionicons name={item.icon} size={20} color={colors.lavender} />
            <Text style={styles.menuLabel}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </PressableScale>
        ))}
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel="Cerrar sesión"
          onPress={signOut}
          style={styles.menuItem}
        >
          <Ionicons name="log-out" size={20} color={colors.error} />
          <Text style={[styles.menuLabel, { color: colors.error }]}>Cerrar sesión</Text>
        </PressableScale>
      </View>

      <FadeIn delay={200}>
        <Text style={styles.version}>UrNight móvil · demo v0.1 · rama feat/mobile-demo</Text>
      </FadeIn>
    </Screen>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.accentSoft,
    borderRadius: radius.full,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  avatarText: { color: colors.lavender, fontSize: typography.heading, fontWeight: '800' },
  badgeCard: {
    alignItems: 'center',
    backgroundColor: colors.bgSurface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.md,
  },
  badgeCell: { flexBasis: '22%', flexGrow: 1 },
  badgeIcon: { fontSize: 24 },
  badgeName: {
    color: colors.textSecondary,
    fontSize: typography.micro,
    textAlign: 'center',
  },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  card: {
    backgroundColor: colors.bgSurface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.sm,
    marginTop: spacing.lg,
    padding: spacing.lg,
  },
  cardHint: { color: colors.textMuted, fontSize: typography.caption },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between' },
  cardSub: { color: colors.textMuted, fontSize: typography.micro },
  cardTitle: { color: colors.textPrimary, fontSize: typography.body, fontWeight: '800' },
  email: { color: colors.textMuted, fontSize: typography.caption },
  header: { alignItems: 'center', flexDirection: 'row', gap: spacing.md },
  menu: {
    backgroundColor: colors.bgSurface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  menuItem: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
  },
  menuLabel: { color: colors.textPrimary, flex: 1, fontSize: typography.body, fontWeight: '600' },
  name: { color: colors.textPrimary, fontSize: typography.heading, fontWeight: '800' },
  progressFill: {
    backgroundColor: colors.accent,
    borderRadius: radius.full,
    height: 8,
  },
  progressTrack: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.full,
    height: 8,
    overflow: 'hidden',
  },
  version: {
    color: colors.textMuted,
    fontSize: typography.micro,
    marginTop: spacing.xl,
    textAlign: 'center',
  },
  walletCard: { alignItems: 'center', flexDirection: 'row', gap: spacing.md },
  walletLabel: { color: colors.textMuted, fontSize: typography.micro, fontWeight: '700' },
  walletSaldo: { color: colors.textPrimary, fontSize: typography.title, fontWeight: '900' },
});
