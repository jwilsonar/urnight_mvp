import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { FadeIn, PressableScale } from '../../components/motion';
import { Badge, Screen, SectionTitle } from '../../components/primitives';
import {
  TICKET_ESTADO_LABEL,
  TICKETS_DEMO,
  type TicketDemo,
} from '../../lib/mock/tickets';
import { absoluteFill, colors, radius, spacing, typography } from '../../lib/theme';

/**
 * Billetera de entradas: cada ticket muestra su QR único al expandirse.
 * El QR va sobre caja blanca para garantizar lectura en la puerta.
 */
export default function EntradasScreen() {
  const [openId, setOpenId] = useState<string | null>(TICKETS_DEMO[0]?.id ?? null);

  return (
    <Screen>
      <FadeIn>
        <Text style={styles.title}>Mis entradas</Text>
        <Text style={styles.subtitle}>
          Muestra el QR en la puerta. Al validarse, se desbloquea la carta del local.
        </Text>
      </FadeIn>

      <SectionTitle hint={`${TICKETS_DEMO.length} entradas`}>Esta semana</SectionTitle>
      <View style={{ gap: spacing.lg }}>
        {TICKETS_DEMO.map((ticket, i) => (
          <FadeIn key={ticket.id} delay={i * 70}>
            <TicketCard
              ticket={ticket}
              open={openId === ticket.id}
              onToggle={() => setOpenId((prev) => (prev === ticket.id ? null : ticket.id))}
            />
          </FadeIn>
        ))}
      </View>

      <FadeIn delay={200}>
        <View style={styles.demoNote}>
          <Ionicons name="information-circle" size={16} color={colors.info} />
          <Text style={styles.demoNoteText}>
            Demo: con backend, las entradas llegan de tu cuenta y el QR rota por seguridad.
          </Text>
        </View>
      </FadeIn>
    </Screen>
  );
}

function TicketCard({
  ticket,
  open,
  onToggle,
}: {
  ticket: TicketDemo;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <PressableScale onPress={onToggle} accessibilityRole="button" style={styles.card}>
      <Image source={{ uri: ticket.imageUrl }} style={styles.cardImg} />
      <View style={styles.cardOverlay} />
      <View style={styles.cardBody}>
        <View style={styles.cardHeader}>
          <Badge tone={ticket.estado === 'valid' ? 'success' : 'muted'}>
            {TICKET_ESTADO_LABEL[ticket.estado]}
          </Badge>
          <Ionicons
            name={open ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={colors.textSecondary}
          />
        </View>
        <Text style={styles.cardName}>{ticket.evento}</Text>
        <Text style={styles.cardMeta}>
          {ticket.local} · {ticket.fechaLabel} · {ticket.horaLabel}
        </Text>
        <Text style={styles.cardTipo}>{ticket.tipo}</Text>

        {open ? (
          <View style={styles.qrWrap}>
            <View style={styles.qrBox}>
              <QRCode value={ticket.qrPayload} size={180} backgroundColor="#FFFFFF" />
            </View>
            <Text style={styles.qrHint}>{ticket.asistente}</Text>
            <Text style={styles.qrSub}>
              {ticket.estado === 'used'
                ? 'Validada — ya puedes pedir de la carta del local'
                : 'Sube el brillo de tu pantalla al llegar'}
            </Text>
          </View>
        ) : null}
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, overflow: 'hidden' },
  cardBody: { gap: spacing.xs, padding: spacing.lg },
  cardHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  cardImg: { ...absoluteFill },
  cardMeta: { color: colors.textSecondary, fontSize: typography.caption },
  cardName: { color: colors.textPrimary, fontSize: typography.title, fontWeight: '800' },
  cardOverlay: {
    ...absoluteFill,
    backgroundColor: 'rgba(11, 11, 18, 0.78)',
  },
  cardTipo: { color: colors.lavender, fontSize: typography.micro, fontWeight: '600' },
  demoNote: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  demoNoteText: { color: colors.textMuted, flex: 1, fontSize: typography.micro },
  qrBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    padding: spacing.md,
  },
  qrHint: {
    color: colors.textPrimary,
    fontSize: typography.body,
    fontWeight: '700',
    marginTop: spacing.md,
  },
  qrSub: { color: colors.textMuted, fontSize: typography.micro, textAlign: 'center' },
  qrWrap: { alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.lg },
  subtitle: { color: colors.textMuted, fontSize: typography.caption, marginTop: spacing.xs },
  title: { color: colors.textPrimary, fontSize: typography.display, fontWeight: '900' },
});
