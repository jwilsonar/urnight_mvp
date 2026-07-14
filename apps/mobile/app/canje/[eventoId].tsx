import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Animated, Image, StyleSheet, Text, TextInput, View } from 'react-native';

import { FadeIn, PressableScale } from '../../components/motion';
import { Screen } from '../../components/primitives';
import { eventoById } from '../../lib/mock/eventos';
import { colors, radius, spacing, typography } from '../../lib/theme';

/** Códigos de promotor válidos en la demo (case-insensitive). */
const CODIGOS_VALIDOS = ['ANDREA10', 'LUIS20'];

/**
 * Canje de entrada gratuita con código de promotor. Con backend, el código
 * se valida contra el módulo de promotores y emite el ticket real (QR único).
 */
export default function CanjeScreen() {
  const { eventoId } = useLocalSearchParams<{ eventoId: string }>();
  const router = useRouter();
  const evento = eventoById(eventoId ?? '');

  const [codigo, setCodigo] = useState('');
  const [status, setStatus] = useState<'idle' | 'error' | 'success'>('idle');
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const shake = () => {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const canjear = () => {
    const normalizado = codigo.trim().toUpperCase();
    if (CODIGOS_VALIDOS.includes(normalizado)) {
      setStatus('success');
      return;
    }
    setStatus('error');
    shake();
  };

  if (status === 'success') {
    return (
      <Screen scroll={false} style={styles.confirmScreen}>
        <FadeIn style={styles.confirmCard}>
          <Ionicons name="checkmark-circle" size={48} color={colors.success} />
          <Text style={styles.confirmTitle}>¡Entrada canjeada!</Text>
          <Text style={styles.confirmSub}>Tu QR único ya está en Entradas.</Text>
        </FadeIn>
        <FadeIn delay={120}>
          <PressableScale
            onPress={() => router.replace('/(tabs)/entradas')}
            accessibilityRole="button"
            accessibilityLabel="Ver mi QR"
            style={styles.primaryBtn}
          >
            <Text style={styles.primaryBtnText}>Ver mi QR</Text>
          </PressableScale>
        </FadeIn>
      </Screen>
    );
  }

  return (
    <Screen>
      <FadeIn>
        {evento ? (
          <View style={styles.header}>
            <Image source={{ uri: evento.imageUrl }} style={styles.thumb} />
            <View style={{ flex: 1 }}>
              <Text style={styles.headerName} numberOfLines={1}>
                {evento.nombre}
              </Text>
              <Text style={styles.headerMeta} numberOfLines={1}>
                {evento.local} · {evento.fechaLabel}
              </Text>
            </View>
          </View>
        ) : (
          <Text style={styles.notFound}>Evento no encontrado</Text>
        )}
      </FadeIn>

      <FadeIn delay={70}>
        <Text style={styles.explainer}>
          Los promotores comparten códigos para entradas gratuitas. Ingresa el tuyo:
        </Text>
      </FadeIn>

      <FadeIn delay={120}>
        <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
          <TextInput
            value={codigo}
            onChangeText={(text) => {
              setCodigo(text);
              if (status === 'error') setStatus('idle');
            }}
            placeholder="Prueba ANDREA10"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="characters"
            autoCorrect={false}
            style={[styles.input, status === 'error' ? styles.inputError : null]}
            accessibilityLabel="Código de promotor"
          />
        </Animated.View>
        {status === 'error' ? (
          <Text style={styles.errorText}>Código no válido. Demo: usa ANDREA10.</Text>
        ) : null}
      </FadeIn>

      <FadeIn delay={170}>
        <PressableScale
          onPress={canjear}
          accessibilityRole="button"
          accessibilityLabel="Canjear entrada"
          style={styles.primaryBtn}
        >
          <Ionicons name="ticket" size={18} color={colors.textPrimary} />
          <Text style={styles.primaryBtnText}>Canjear entrada</Text>
        </PressableScale>
      </FadeIn>

      <FadeIn delay={220}>
        <Text style={styles.demoNote}>Demo: el canje real valida el código con el backend.</Text>
      </FadeIn>
    </Screen>
  );
}

const styles = StyleSheet.create({
  confirmCard: {
    alignItems: 'center',
    backgroundColor: colors.bgSurface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.xxl,
  },
  confirmScreen: { gap: spacing.xl, justifyContent: 'center' },
  confirmSub: { color: colors.textSecondary, fontSize: typography.caption, textAlign: 'center' },
  confirmTitle: { color: colors.textPrimary, fontSize: typography.title, fontWeight: '800' },
  demoNote: { color: colors.textMuted, fontSize: typography.micro, marginTop: spacing.xl, textAlign: 'center' },
  errorText: { color: colors.error, fontSize: typography.caption, marginTop: spacing.sm, textAlign: 'center' },
  explainer: {
    color: colors.textSecondary,
    fontSize: typography.body,
    lineHeight: 22,
    marginTop: spacing.xl,
    textAlign: 'center',
  },
  header: { alignItems: 'center', flexDirection: 'row', gap: spacing.md },
  headerMeta: { color: colors.textMuted, fontSize: typography.caption },
  headerName: { color: colors.textPrimary, fontSize: typography.body, fontWeight: '800' },
  input: {
    backgroundColor: colors.bgSurface,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    borderWidth: 1,
    color: colors.textPrimary,
    fontSize: typography.title,
    fontWeight: '800',
    letterSpacing: 4,
    marginTop: spacing.xl,
    paddingVertical: spacing.lg,
    textAlign: 'center',
  },
  inputError: { borderColor: colors.error },
  notFound: { color: colors.textMuted, fontSize: typography.body },
  primaryBtn: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    marginTop: spacing.xl,
    paddingVertical: spacing.lg,
  },
  primaryBtnText: { color: colors.textPrimary, fontSize: typography.body, fontWeight: '800' },
  thumb: { borderRadius: radius.sm, height: 64, width: 64 },
});
