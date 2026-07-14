import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';

import { FadeIn, PressableScale } from '../components/motion';
import { Screen } from '../components/primitives';
import { useSession } from '../lib/session';
import { colors, radius, spacing, typography } from '../lib/theme';

/**
 * Registro: el header nativo ya da el título "Crear cuenta" (app/_layout.tsx).
 * Regla del negocio +18 obligatoria vía checkbox propio. Demo — con el
 * backend de identidad esto crea la cuenta real.
 */
export default function RegistroScreen() {
  const router = useRouter();
  const { signIn } = useSession();
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [mayorEdad, setMayorEdad] = useState(false);

  const puedeCrear = nombre.trim().length > 0 && email.trim().length > 0 && mayorEdad;

  const handleCrear = () => {
    if (!puedeCrear) return;
    signIn({ name: nombre.trim(), email: email.trim() });
    router.replace('/(tabs)');
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Screen>
        <FadeIn>
          <Text style={styles.lead}>
            Crea tu cuenta para reservar mesas, canjear entradas y guardar tus locales favoritos.
          </Text>
        </FadeIn>

        <FadeIn delay={60} style={styles.form}>
          <Field label="Nombre completo">
            <TextInput
              value={nombre}
              onChangeText={setNombre}
              placeholder="Tu nombre y apellido"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              accessibilityLabel="Nombre completo"
            />
          </Field>
          <Field label="Correo electrónico">
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="tucorreo@ejemplo.com"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.input}
              accessibilityLabel="Correo electrónico"
            />
          </Field>
          <Field label="Contraseña">
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              style={styles.input}
              accessibilityLabel="Contraseña"
            />
          </Field>
          <Field label="Fecha de nacimiento">
            <TextInput
              value={fechaNacimiento}
              onChangeText={setFechaNacimiento}
              placeholder="DD/MM/AAAA"
              placeholderTextColor={colors.textMuted}
              keyboardType="numbers-and-punctuation"
              style={styles.input}
              accessibilityLabel="Fecha de nacimiento"
            />
          </Field>
        </FadeIn>

        <FadeIn delay={120}>
          <PressableScale
            onPress={() => setMayorEdad((v) => !v)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: mayorEdad }}
            accessibilityLabel="Confirmo que tengo 18 años o más"
            style={styles.checkRow}
          >
            <View style={[styles.checkbox, mayorEdad ? styles.checkboxActive : null]}>
              {mayorEdad ? (
                <Ionicons name="checkmark" size={14} color={colors.textPrimary} />
              ) : null}
            </View>
            <Text style={styles.checkLabel}>Confirmo que tengo 18 años o más</Text>
          </PressableScale>
          <Text style={styles.ageNote}>UrNight es solo para mayores de 18 años.</Text>
        </FadeIn>

        <FadeIn delay={170}>
          <PressableScale
            onPress={handleCrear}
            disabled={!puedeCrear}
            accessibilityRole="button"
            accessibilityLabel="Crear cuenta"
            accessibilityState={{ disabled: !puedeCrear }}
            style={[styles.primaryBtn, !puedeCrear ? styles.primaryBtnDisabled : null]}
          >
            <Text style={styles.primaryBtnText}>Crear cuenta</Text>
          </PressableScale>
        </FadeIn>
      </Screen>
    </KeyboardAvoidingView>
  );
}

/** Campo de formulario con label — subcomponente local reutilizable. */
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  ageNote: { color: colors.textMuted, fontSize: typography.micro, marginTop: spacing.sm },
  checkbox: {
    alignItems: 'center',
    backgroundColor: colors.bgSurface,
    borderColor: colors.borderStrong,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    height: 22,
    justifyContent: 'center',
    width: 22,
  },
  checkboxActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  checkLabel: { color: colors.textPrimary, flex: 1, fontSize: typography.body, fontWeight: '600' },
  checkRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl },
  field: { gap: spacing.xs },
  fieldLabel: { color: colors.textSecondary, fontSize: typography.caption, fontWeight: '600' },
  flex: { flex: 1 },
  form: { gap: spacing.md, marginTop: spacing.lg },
  input: {
    backgroundColor: colors.bgSurface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    color: colors.textPrimary,
    fontSize: typography.body,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  lead: { color: colors.textSecondary, fontSize: typography.body, lineHeight: 22, marginTop: spacing.md },
  primaryBtn: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    justifyContent: 'center',
    marginTop: spacing.xl,
    paddingVertical: spacing.lg,
  },
  primaryBtnDisabled: { backgroundColor: colors.bgElevated },
  primaryBtnText: { color: colors.textPrimary, fontSize: typography.body, fontWeight: '800' },
});
