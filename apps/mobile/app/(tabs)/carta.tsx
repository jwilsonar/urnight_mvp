import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';

import { FadeIn, PressableScale } from '../../components/motion';
import { Badge, Chip, Screen, SectionTitle } from '../../components/primitives';
import {
  CARTA_CATEGORIAS_DEMO,
  CARTA_ITEMS_DEMO,
  CARTA_ZONA_RECOJO,
  formatSoles,
  type CartaItemDemo,
} from '../../lib/mock/carta';
import { colors, radius, spacing, typography } from '../../lib/theme';

type Pedido = { code: string; total: number } | null;

/**
 * Carta in-venue (idea Wilson): con la entrada validada, el asistente arma su
 * pedido y lo recoge en barra. Demo sin pagos — la pasarela + wallet llegan
 * después del MVP.
 */
export default function CartaScreen() {
  const [categoria, setCategoria] = useState<string | null>(null);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [pedido, setPedido] = useState<Pedido>(null);

  const items = useMemo(
    () =>
      categoria
        ? CARTA_ITEMS_DEMO.filter((i) => i.categoryId === categoria)
        : CARTA_ITEMS_DEMO,
    [categoria],
  );

  const count = Object.values(cart).reduce((s, n) => s + n, 0);
  const total = Object.entries(cart).reduce((s, [id, n]) => {
    const item = CARTA_ITEMS_DEMO.find((i) => i.id === id);
    return s + (item ? item.priceSoles * n : 0);
  }, 0);

  const add = (id: string) => setCart((c) => ({ ...c, [id]: (c[id] ?? 0) + 1 }));
  const remove = (id: string) =>
    setCart((c) => {
      const next = { ...c };
      const qty = (next[id] ?? 0) - 1;
      if (qty <= 0) delete next[id];
      else next[id] = qty;
      return next;
    });

  const confirmar = () => {
    setPedido({ code: `UN-${Math.floor(100 + Math.random() * 900)}`, total });
    setCart({});
  };

  if (pedido) {
    return <PedidoConfirmado pedido={pedido} onReset={() => setPedido(null)} />;
  }

  return (
    <View style={styles.root}>
      <Screen style={{ paddingBottom: count > 0 ? 110 : spacing.xl }}>
        <FadeIn>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Carta</Text>
              <Text style={styles.subtitle}>Nocturna Club · Recojo: {CARTA_ZONA_RECOJO}</Text>
            </View>
            <Badge tone="success">Entrada validada</Badge>
          </View>
        </FadeIn>

        <FadeIn delay={60}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: spacing.sm }}
            style={{ marginTop: spacing.lg }}
          >
            <Chip label="Todo" active={categoria === null} onPress={() => setCategoria(null)} />
            {CARTA_CATEGORIAS_DEMO.map((c) => (
              <Chip
                key={c.id}
                label={c.nombre}
                active={categoria === c.id}
                onPress={() => setCategoria(c.id)}
              />
            ))}
          </ScrollView>
        </FadeIn>

        <SectionTitle hint={`${items.length} productos`}>
          {categoria
            ? (CARTA_CATEGORIAS_DEMO.find((c) => c.id === categoria)?.nombre ?? 'Carta')
            : 'Toda la carta'}
        </SectionTitle>

        <View style={{ gap: spacing.md }}>
          {items.map((item, i) => (
            <FadeIn key={item.id} delay={Math.min(i, 6) * 50}>
              <ItemRow
                item={item}
                qty={cart[item.id] ?? 0}
                onAdd={() => add(item.id)}
                onRemove={() => remove(item.id)}
              />
            </FadeIn>
          ))}
        </View>

        <FadeIn delay={200}>
          <Text style={styles.demoNote}>
            Demo: el pedido se paga al recoger. Pago en línea llega con la wallet UrNight.
          </Text>
        </FadeIn>
      </Screen>

      {/* Barra de pedido fija */}
      {count > 0 ? (
        <FadeIn style={styles.cartBarWrap}>
          <PressableScale
            onPress={confirmar}
            accessibilityRole="button"
            accessibilityLabel={`Confirmar pedido de ${count} productos por ${formatSoles(total)}`}
            style={styles.cartBar}
          >
            <View style={styles.cartCount}>
              <Text style={styles.cartCountText}>{count}</Text>
            </View>
            <Text style={styles.cartBarText}>Confirmar pedido demo</Text>
            <Text style={styles.cartBarTotal}>{formatSoles(total)}</Text>
          </PressableScale>
        </FadeIn>
      ) : null}
    </View>
  );
}

function ItemRow({
  item,
  qty,
  onAdd,
  onRemove,
}: {
  item: CartaItemDemo;
  qty: number;
  onAdd: () => void;
  onRemove: () => void;
}) {
  return (
    <View style={[styles.item, !item.available && { opacity: 0.5 }]}>
      <Image source={{ uri: item.imageUrl }} style={styles.itemImg} />
      <View style={styles.itemBody}>
        {item.tag ? <Badge tone="info">{item.tag}</Badge> : null}
        <Text style={styles.itemName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.itemDesc} numberOfLines={2}>
          {item.description}
        </Text>
        <Text style={styles.itemPrice}>{formatSoles(item.priceSoles)}</Text>
      </View>
      {item.available ? (
        qty === 0 ? (
          <PressableScale
            onPress={onAdd}
            accessibilityRole="button"
            accessibilityLabel={`Agregar ${item.name}`}
            style={styles.addBtn}
          >
            <Ionicons name="add" size={20} color={colors.textPrimary} />
          </PressableScale>
        ) : (
          <View style={styles.stepper}>
            <PressableScale
              onPress={onRemove}
              accessibilityRole="button"
              accessibilityLabel={`Quitar ${item.name}`}
              style={styles.stepBtn}
            >
              <Ionicons name="remove" size={16} color={colors.lavender} />
            </PressableScale>
            <Text style={styles.stepQty}>{qty}</Text>
            <PressableScale
              onPress={onAdd}
              accessibilityRole="button"
              accessibilityLabel={`Agregar ${item.name}`}
              style={styles.stepBtn}
            >
              <Ionicons name="add" size={16} color={colors.lavender} />
            </PressableScale>
          </View>
        )
      ) : (
        <Badge tone="muted">Agotado</Badge>
      )}
    </View>
  );
}

function PedidoConfirmado({ pedido, onReset }: { pedido: { code: string }; onReset: () => void }) {
  return (
    <Screen scroll={false} style={styles.confirmScreen}>
      <FadeIn style={styles.confirmCard}>
        <Ionicons name="checkmark-circle" size={48} color={colors.success} />
        <Text style={styles.confirmLabel}>TU CÓDIGO DE RECOJO</Text>
        <Text style={styles.confirmCode}>{pedido.code}</Text>
        <Text style={styles.confirmZone}>
          <Ionicons name="location" size={14} color={colors.textMuted} /> {CARTA_ZONA_RECOJO}
        </Text>
        <Text style={styles.confirmHint}>
          Te avisaremos cuando esté listo. Muestra este código en la barra y paga al recoger.
        </Text>
      </FadeIn>
      <FadeIn delay={120}>
        <PressableScale onPress={onReset} accessibilityRole="button" style={styles.againBtn}>
          <Text style={styles.againBtnText}>Pedir algo más</Text>
        </PressableScale>
      </FadeIn>
    </Screen>
  );
}

const styles = StyleSheet.create({
  addBtn: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: radius.full,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  againBtn: {
    alignItems: 'center',
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    borderWidth: 1,
    marginTop: spacing.xl,
    paddingVertical: spacing.md,
  },
  againBtnText: { color: colors.textPrimary, fontSize: typography.body, fontWeight: '700' },
  cartBar: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + 2,
  },
  cartBarText: { color: colors.textPrimary, flex: 1, fontSize: typography.body, fontWeight: '800' },
  cartBarTotal: { color: colors.textPrimary, fontSize: typography.body, fontWeight: '800' },
  cartBarWrap: {
    bottom: spacing.lg,
    left: spacing.lg,
    position: 'absolute',
    right: spacing.lg,
  },
  cartCount: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: radius.full,
    height: 24,
    justifyContent: 'center',
    minWidth: 24,
  },
  cartCountText: { color: colors.textPrimary, fontSize: typography.caption, fontWeight: '800' },
  confirmCard: {
    alignItems: 'center',
    backgroundColor: colors.bgSurface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.xxl,
  },
  confirmCode: {
    color: colors.lavender,
    fontSize: 44,
    fontWeight: '900',
    letterSpacing: 4,
  },
  confirmHint: {
    color: colors.textMuted,
    fontSize: typography.caption,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  confirmLabel: {
    color: colors.textMuted,
    fontSize: typography.micro,
    fontWeight: '700',
    letterSpacing: 2,
    marginTop: spacing.md,
  },
  confirmScreen: { justifyContent: 'center' },
  confirmZone: { color: colors.textSecondary, fontSize: typography.caption },
  demoNote: {
    color: colors.textMuted,
    fontSize: typography.micro,
    marginTop: spacing.xl,
    textAlign: 'center',
  },
  headerRow: { alignItems: 'flex-start', flexDirection: 'row', gap: spacing.md },
  item: {
    alignItems: 'center',
    backgroundColor: colors.bgSurface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  itemBody: { flex: 1, gap: 2 },
  itemDesc: { color: colors.textMuted, fontSize: typography.micro },
  itemImg: { borderRadius: radius.sm, height: 64, width: 64 },
  itemName: { color: colors.textPrimary, fontSize: typography.body, fontWeight: '700' },
  itemPrice: { color: colors.lavender, fontSize: typography.caption, fontWeight: '800' },
  root: { backgroundColor: colors.bgRoot, flex: 1 },
  stepBtn: {
    alignItems: 'center',
    borderColor: colors.borderStrong,
    borderRadius: radius.full,
    borderWidth: 1,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  stepQty: {
    color: colors.textPrimary,
    fontSize: typography.body,
    fontWeight: '800',
    minWidth: 18,
    textAlign: 'center',
  },
  stepper: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  subtitle: { color: colors.textMuted, fontSize: typography.caption, marginTop: 2 },
  title: { color: colors.textPrimary, fontSize: typography.display, fontWeight: '900' },
});
