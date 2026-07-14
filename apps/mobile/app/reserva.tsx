import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, ScrollView, StyleSheet, Text, View } from 'react-native';

import { FadeIn, PressableScale } from '../components/motion';
import { Chip, Screen, SectionTitle } from '../components/primitives';
import { formatSoles } from '../lib/mock/carta';
import { LOCALES_DEMO, type LocalDemo } from '../lib/mock/eventos';
import { colors, motion, radius, spacing, typography } from '../lib/theme';

type ZonaId = 'pista' | 'vip' | 'lounge';

interface ZonaMesa {
  id: ZonaId;
  nombre: string;
  descripcion: string;
  depositoSoles: number;
}

const ZONAS_MESA: ZonaMesa[] = [
  { id: 'pista', nombre: 'Pista', descripcion: 'Vive la fiesta a pie de pista.', depositoSoles: 150 },
  { id: 'vip', nombre: 'Box VIP', descripcion: 'Privacidad y servicio exclusivo.', depositoSoles: 400 },
  { id: 'lounge', nombre: 'Lounge', descripcion: 'Comodidad y buena vista del show.', depositoSoles: 250 },
];

const FECHAS_DEMO = ['Vie 17 Jul', 'Sáb 18 Jul', 'Vie 24 Jul'];

/**
 * Reserva de mesa: wizard demo en una sola pantalla (header nativo "Reservar
 * mesa" ya configurado). Con backend, esto crea la reserva real vía el
 * módulo de eventos/mesas y el depósito se cobra en la pasarela de pagos.
 */
export default function ReservaScreen() {
  const router = useRouter();
  const [paso, setPaso] = useState(1);
  const [localSlug, setLocalSlug] = useState<string | null>(null);
  const [zonaId, setZonaId] = useState<ZonaId | null>(null);
  const [personas, setPersonas] = useState(2);
  const [fecha, setFecha] = useState<string | null>(null);
  const [confirmado, setConfirmado] = useState(false);
  const [codigo, setCodigo] = useState('');

  const local = LOCALES_DEMO.find((l) => l.slug === localSlug) ?? null;
  const zona = ZONAS_MESA.find((z) => z.id === zonaId) ?? null;

  const puedeContinuar = paso === 1 ? Boolean(local && zona) : paso === 2 ? Boolean(fecha) : true;

  const handleContinuar = () => setPaso((p) => Math.min(3, p + 1));
  const handleAtras = () => setPaso((p) => Math.max(1, p - 1));

  const handleConfirmar = () => {
    setCodigo(`RSV-${Math.floor(100 + Math.random() * 900)}`);
    setConfirmado(true);
  };

  if (confirmado && zona) {
    return (
      <Screen scroll={false} style={styles.center}>
        <FadeIn style={styles.successBox}>
          <Ionicons name="checkmark-circle" size={72} color={colors.success} />
          <Text style={styles.successTitle}>¡Reserva confirmada!</Text>
          <Text style={styles.successCode}>{codigo}</Text>
          <Text style={styles.successNote}>
            Muestra este código al llegar. El depósito se paga en el local (demo — pagos llegan
            con la pasarela).
          </Text>
          <PressableScale
            onPress={() => router.replace('/(tabs)')}
            accessibilityRole="button"
            accessibilityLabel="Volver al inicio"
            style={styles.primaryBtn}
          >
            <Text style={styles.primaryBtnText}>Volver al inicio</Text>
          </PressableScale>
        </FadeIn>
      </Screen>
    );
  }

  return (
    <Screen>
      <ProgresoPasos paso={paso} />

      <FadeIn key={paso}>
        {paso === 1 ? (
          <PasoLocalZona local={local} zona={zona} onLocal={setLocalSlug} onZona={setZonaId} />
        ) : paso === 2 ? (
          <PasoDetalles personas={personas} onPersonas={setPersonas} fecha={fecha} onFecha={setFecha} />
        ) : (
          <PasoResumen local={local} zona={zona} personas={personas} fecha={fecha} />
        )}
      </FadeIn>

      <View style={styles.navRow}>
        {paso > 1 ? (
          <PressableScale
            onPress={handleAtras}
            accessibilityRole="button"
            accessibilityLabel="Atrás"
            style={styles.backBtn}
          >
            <Text style={styles.backBtnText}>Atrás</Text>
          </PressableScale>
        ) : (
          <View style={styles.navSpacer} />
        )}
        {paso < 3 ? (
          <PressableScale
            onPress={handleContinuar}
            disabled={!puedeContinuar}
            accessibilityRole="button"
            accessibilityLabel="Continuar"
            accessibilityState={{ disabled: !puedeContinuar }}
            style={[styles.continueBtn, !puedeContinuar ? styles.continueBtnDisabled : null]}
          >
            <Text style={styles.continueBtnText}>Continuar</Text>
          </PressableScale>
        ) : (
          <PressableScale
            onPress={handleConfirmar}
            accessibilityRole="button"
            accessibilityLabel="Confirmar reserva demo"
            style={styles.continueBtn}
          >
            <Text style={styles.continueBtnText}>Confirmar reserva demo</Text>
          </PressableScale>
        )}
      </View>
    </Screen>
  );
}

/** Indicador de progreso: 3 segmentos, el activo (y previos) en accent. */
function ProgresoPasos({ paso }: { paso: number }) {
  const anims = useRef([1, 2, 3].map((p) => new Animated.Value(p <= paso ? 1 : 0))).current;

  useEffect(() => {
    anims.forEach((anim, i) => {
      Animated.timing(anim, {
        toValue: i + 1 <= paso ? 1 : 0,
        duration: motion.base,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    });
  }, [paso, anims]);

  return (
    <View style={styles.progresoRow}>
      {anims.map((anim, i) => (
        <Animated.View
          key={i}
          style={[
            styles.progresoSeg,
            {
              backgroundColor: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [colors.bgElevated, colors.accent],
              }),
            },
          ]}
        />
      ))}
    </View>
  );
}

function PasoLocalZona({
  local,
  zona,
  onLocal,
  onZona,
}: {
  local: LocalDemo | null;
  zona: ZonaMesa | null;
  onLocal: (slug: string) => void;
  onZona: (id: ZonaId) => void;
}) {
  return (
    <View>
      <SectionTitle>Local y zona</SectionTitle>

      <Text style={styles.label}>Elige el local</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.localRow}
      >
        {LOCALES_DEMO.map((l) => (
          <PressableScale
            key={l.slug}
            onPress={() => onLocal(l.slug)}
            accessibilityRole="button"
            accessibilityState={{ selected: local?.slug === l.slug }}
            accessibilityLabel={l.nombre}
            style={[styles.localCard, local?.slug === l.slug ? styles.localCardActive : null]}
          >
            <Image source={{ uri: l.imageUrl }} style={styles.localImg} />
            <Text style={styles.localName} numberOfLines={1}>
              {l.nombre}
            </Text>
            <Text style={styles.localZona}>{l.zona}</Text>
          </PressableScale>
        ))}
      </ScrollView>

      <Text style={[styles.label, styles.labelSpaced]}>Zona de mesa</Text>
      <View style={{ gap: spacing.md }}>
        {ZONAS_MESA.map((z) => (
          <PressableScale
            key={z.id}
            onPress={() => onZona(z.id)}
            accessibilityRole="radio"
            accessibilityState={{ selected: zona?.id === z.id }}
            accessibilityLabel={`${z.nombre}, depósito ${formatSoles(z.depositoSoles)}`}
            style={[styles.zonaCard, zona?.id === z.id ? styles.zonaCardActive : null]}
          >
            <View style={[styles.radio, zona?.id === z.id ? styles.radioActive : null]}>
              {zona?.id === z.id ? <View style={styles.radioDot} /> : null}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.zonaName}>{z.nombre}</Text>
              <Text style={styles.zonaDesc}>{z.descripcion}</Text>
            </View>
            <Text style={styles.zonaPrice}>{formatSoles(z.depositoSoles)}</Text>
          </PressableScale>
        ))}
      </View>
    </View>
  );
}

function PasoDetalles({
  personas,
  onPersonas,
  fecha,
  onFecha,
}: {
  personas: number;
  onPersonas: (n: number) => void;
  fecha: string | null;
  onFecha: (f: string) => void;
}) {
  return (
    <View>
      <SectionTitle>Detalles</SectionTitle>

      <Text style={styles.label}>Número de personas</Text>
      <View style={styles.stepperRow}>
        <PressableScale
          onPress={() => onPersonas(Math.max(2, personas - 1))}
          disabled={personas <= 2}
          accessibilityRole="button"
          accessibilityLabel="Reducir número de personas"
          style={[styles.stepperBtn, personas <= 2 ? styles.stepperBtnDisabled : null]}
        >
          <Ionicons name="remove" size={18} color={colors.textPrimary} />
        </PressableScale>
        <Text style={styles.stepperValue}>{personas}</Text>
        <PressableScale
          onPress={() => onPersonas(Math.min(12, personas + 1))}
          disabled={personas >= 12}
          accessibilityRole="button"
          accessibilityLabel="Aumentar número de personas"
          style={[styles.stepperBtn, personas >= 12 ? styles.stepperBtnDisabled : null]}
        >
          <Ionicons name="add" size={18} color={colors.textPrimary} />
        </PressableScale>
      </View>

      <Text style={[styles.label, styles.labelSpaced]}>Fecha</Text>
      <View style={styles.chipRow}>
        {FECHAS_DEMO.map((f) => (
          <Chip key={f} label={f} active={fecha === f} onPress={() => onFecha(f)} />
        ))}
      </View>
    </View>
  );
}

function PasoResumen({
  local,
  zona,
  personas,
  fecha,
}: {
  local: LocalDemo | null;
  zona: ZonaMesa | null;
  personas: number;
  fecha: string | null;
}) {
  return (
    <View>
      <SectionTitle>Resumen</SectionTitle>
      <View style={styles.resumenCard}>
        <ResumenRow label="Local" value={local?.nombre ?? '—'} />
        <ResumenRow label="Zona" value={zona?.nombre ?? '—'} />
        <ResumenRow label="Personas" value={String(personas)} />
        <ResumenRow label="Fecha" value={fecha ?? '—'} />
        <ResumenRow label="Depósito" value={zona ? formatSoles(zona.depositoSoles) : '—'} destacado />
      </View>
    </View>
  );
}

function ResumenRow({
  label,
  value,
  destacado,
}: {
  label: string;
  value: string;
  destacado?: boolean;
}) {
  return (
    <View style={styles.resumenRow}>
      <Text style={styles.resumenLabel}>{label}</Text>
      <Text style={[styles.resumenValue, destacado ? styles.resumenValueAccent : null]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backBtn: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  backBtnText: { color: colors.textSecondary, fontSize: typography.body, fontWeight: '700' },
  center: { alignItems: 'center', justifyContent: 'center' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  continueBtn: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    flex: 1,
    justifyContent: 'center',
    paddingVertical: spacing.lg,
  },
  continueBtnDisabled: { backgroundColor: colors.bgElevated },
  continueBtnText: { color: colors.textPrimary, fontSize: typography.body, fontWeight: '800' },
  label: { color: colors.textSecondary, fontSize: typography.caption, fontWeight: '700', marginBottom: spacing.md },
  labelSpaced: { marginTop: spacing.xl },
  localCard: {
    backgroundColor: colors.bgSurface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    overflow: 'hidden',
    width: 140,
  },
  localCardActive: { borderColor: colors.accent },
  localImg: { height: 90, width: '100%' },
  localName: { color: colors.textPrimary, fontSize: typography.caption, fontWeight: '700', marginTop: spacing.sm, paddingHorizontal: spacing.sm },
  localRow: { gap: spacing.md, paddingBottom: spacing.xs },
  localZona: { color: colors.textMuted, fontSize: typography.micro, paddingBottom: spacing.sm, paddingHorizontal: spacing.sm },
  navRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xxl },
  navSpacer: { flex: 1 },
  primaryBtn: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    justifyContent: 'center',
    marginTop: spacing.xl,
    paddingVertical: spacing.lg,
    width: '100%',
  },
  primaryBtnText: { color: colors.textPrimary, fontSize: typography.body, fontWeight: '800' },
  progresoRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  progresoSeg: { borderRadius: radius.full, flex: 1, height: 6 },
  radio: {
    alignItems: 'center',
    borderColor: colors.borderStrong,
    borderRadius: radius.full,
    borderWidth: 1.5,
    height: 20,
    justifyContent: 'center',
    width: 20,
  },
  radioActive: { borderColor: colors.accent },
  radioDot: { backgroundColor: colors.accent, borderRadius: radius.full, height: 10, width: 10 },
  resumenCard: {
    backgroundColor: colors.bgSurface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
  },
  resumenLabel: { color: colors.textMuted, fontSize: typography.caption },
  resumenRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  resumenValue: { color: colors.textPrimary, fontSize: typography.body, fontWeight: '700' },
  resumenValueAccent: { color: colors.lavender, fontSize: typography.heading, fontWeight: '800' },
  stepperBtn: {
    alignItems: 'center',
    backgroundColor: colors.bgSurface,
    borderColor: colors.border,
    borderRadius: radius.full,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  stepperBtnDisabled: { opacity: 0.4 },
  stepperRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.xl },
  stepperValue: { color: colors.textPrimary, fontSize: typography.title, fontWeight: '800', minWidth: 32, textAlign: 'center' },
  successBox: { alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg },
  successCode: { color: colors.lavender, fontSize: typography.display, fontWeight: '900', letterSpacing: 2, marginTop: spacing.sm },
  successNote: { color: colors.textMuted, fontSize: typography.caption, marginTop: spacing.sm, textAlign: 'center' },
  successTitle: { color: colors.textPrimary, fontSize: typography.title, fontWeight: '800', marginTop: spacing.lg },
  zonaCard: {
    alignItems: 'center',
    backgroundColor: colors.bgSurface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
  },
  zonaCardActive: { borderColor: colors.accent },
  zonaDesc: { color: colors.textMuted, fontSize: typography.micro, marginTop: 2 },
  zonaName: { color: colors.textPrimary, fontSize: typography.body, fontWeight: '700' },
  zonaPrice: { color: colors.textSecondary, fontSize: typography.caption, fontWeight: '700' },
});
