import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { FadeIn, PressableScale } from '../../components/motion';
import { Badge, Screen } from '../../components/primitives';
import { NOTIFICACIONES_DEMO, type NotificacionDemo } from '../../lib/mock/perfil';
import { colors, radius, spacing, typography } from '../../lib/theme';

/**
 * Notificaciones del asistente: estado local de leído/no leído inicializado
 * desde NOTIFICACIONES_DEMO. Con backend, esto se sincroniza con el módulo
 * de notificaciones (lectura + marcado vía api-client).
 */

const ICONO_POR_TIPO: Record<NotificacionDemo['tipo'], keyof typeof Ionicons.glyphMap> = {
  pedido: 'wine',
  evento: 'calendar',
  puntos: 'star',
  sistema: 'information-circle',
};

export default function NotificacionesScreen() {
  const [items, setItems] = useState<NotificacionDemo[]>(NOTIFICACIONES_DEMO);
  const sinLeer = items.filter((n) => !n.leida).length;

  function marcarLeida(id: string) {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, leida: true } : n)));
  }

  function marcarTodas() {
    setItems((prev) => prev.map((n) => ({ ...n, leida: true })));
  }

  return (
    <Screen>
      <FadeIn>
        <View style={styles.header}>
          <Badge tone={sinLeer > 0 ? 'accent' : 'muted'}>
            {sinLeer > 0 ? `${sinLeer} sin leer` : 'Todo leído'}
          </Badge>
          {sinLeer > 0 ? (
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel="Marcar todas las notificaciones como leídas"
              onPress={marcarTodas}
            >
              <Text style={styles.marcarTodas}>Marcar todas</Text>
            </PressableScale>
          ) : null}
        </View>
      </FadeIn>

      {items.length === 0 ? (
        <FadeIn delay={60}>
          <View style={styles.empty}>
            <Ionicons name="notifications-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyText}>No tienes notificaciones</Text>
          </View>
        </FadeIn>
      ) : (
        <View style={styles.list}>
          {items.map((n, i) => (
            <FadeIn key={n.id} delay={i * 50}>
              <PressableScale
                accessibilityRole="button"
                accessibilityLabel={`Notificación: ${n.titulo}${n.leida ? '' : ', no leída'}`}
                onPress={() => marcarLeida(n.id)}
                style={[styles.row, !n.leida ? styles.rowUnread : null]}
              >
                <View style={styles.icono}>
                  <Ionicons name={ICONO_POR_TIPO[n.tipo]} size={18} color={colors.lavender} />
                </View>
                <View style={{ flex: 1, opacity: n.leida ? 0.6 : 1 }}>
                  <Text style={styles.titulo}>{n.titulo}</Text>
                  <Text style={styles.detalle} numberOfLines={2}>
                    {n.detalle}
                  </Text>
                  <Text style={styles.fecha}>{n.fechaLabel}</Text>
                </View>
                {!n.leida ? <View style={styles.dot} /> : null}
              </PressableScale>
            </FadeIn>
          ))}
        </View>
      )}

      {items.length > 0 && sinLeer === 0 ? (
        <FadeIn delay={items.length * 50 + 40}>
          <Text style={styles.allRead}>Estás al día con tus notificaciones ✨</Text>
        </FadeIn>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  allRead: {
    color: colors.textMuted,
    fontSize: typography.caption,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  detalle: { color: colors.textMuted, fontSize: typography.caption, marginTop: 2 },
  dot: { backgroundColor: colors.accent, borderRadius: radius.full, height: 8, width: 8 },
  empty: { alignItems: 'center', gap: spacing.sm, marginTop: spacing.xxl, paddingVertical: spacing.xl },
  emptyText: { color: colors.textMuted, fontSize: typography.body, fontWeight: '600' },
  fecha: { color: colors.textMuted, fontSize: typography.micro, marginTop: 2 },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  icono: {
    alignItems: 'center',
    backgroundColor: colors.accentSoft,
    borderRadius: radius.full,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  list: {
    backgroundColor: colors.bgSurface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    marginTop: spacing.lg,
    overflow: 'hidden',
  },
  marcarTodas: { color: colors.lavender, fontSize: typography.caption, fontWeight: '700' },
  row: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
  },
  rowUnread: { backgroundColor: colors.bgElevated },
  titulo: { color: colors.textPrimary, fontSize: typography.body, fontWeight: '700' },
});
