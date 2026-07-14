import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState, type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { FadeIn, PressableScale } from '../components/motion';
import { Screen } from '../components/primitives';
import { useSession } from '../lib/session';
import { colors, radius, spacing, typography } from '../lib/theme';

/** Deriva un nombre demo a partir del correo: parte antes de @, capitalizada. */
function nombreDesdeEmail(email: string): string {
  const local = email.split('@')[0]?.trim();
  if (!local) return 'Invitado UrNight';
  return local.charAt(0).toUpperCase() + local.slice(1);
}

/**
 * Login: pantalla sin header (ya configurado en app/_layout.tsx). Demo — con
 * el backend de identidad esto pasa a validar credenciales reales.
 */
export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleEntrar = () => {
    signIn({ name: nombreDesdeEmail(email), email: email.trim() || 'demo@urnight.pe' });
    router.replace('/(tabs)');
  };

  const handleGoogleDemo = () => {
    signIn({ name: 'Invitado UrNight', email: 'demo@urnight.pe' });
    router.replace('/(tabs)');
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Screen>
        <FadeIn>
          <Text style={styles.eyebrow}>TU NOCHE EMPIEZA AQUÍ</Text>
          <Text style={styles.title}>UrNight</Text>
          <Text style={styles.tagline}>
            Entradas, mesas y la carta del local en un solo lugar.
          </Text>
        </FadeIn>

        <FadeIn delay={70} style={styles.form}>
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
        </FadeIn>

        <FadeIn delay={130}>
          <PressableScale
            onPress={handleEntrar}
            accessibilityRole="button"
            accessibilityLabel="Entrar"
            style={styles.primaryBtn}
          >
            <Text style={styles.primaryBtnText}>Entrar</Text>
          </PressableScale>
        </FadeIn>

        <FadeIn delay={170} style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>o</Text>
          <View style={styles.dividerLine} />
        </FadeIn>

        <FadeIn delay={200}>
          <PressableScale
            onPress={handleGoogleDemo}
            accessibilityRole="button"
            accessibilityLabel="Continuar con Google (demo)"
            style={styles.secondaryBtn}
          >
            <Ionicons name="logo-google" size={18} color={colors.textPrimary} />
            <Text style={styles.secondaryBtnText}>Continuar con Google (demo)</Text>
          </PressableScale>
        </FadeIn>

        <FadeIn delay={240} style={styles.footer}>
          <Pressable
            onPress={() => router.push('/registro')}
            accessibilityRole="button"
            accessibilityLabel="Crear cuenta"
          >
            <Text style={styles.footerText}>
              ¿Nuevo en UrNight? <Text style={styles.footerLink}>Crear cuenta</Text>
            </Text>
          </Pressable>
          <Text style={styles.demoNote}>
            Demo: cualquier credencial funciona; la autenticación real llega con el backend de
            identidad.
          </Text>
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
  demoNote: { color: colors.textMuted, fontSize: typography.micro, marginTop: spacing.sm, textAlign: 'center' },
  dividerLine: { backgroundColor: colors.border, flex: 1, height: 1 },
  dividerRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.md, marginVertical: spacing.xl },
  dividerText: { color: colors.textMuted, fontSize: typography.caption, fontWeight: '600' },
  eyebrow: { color: colors.lavender, fontSize: typography.micro, fontWeight: '700', letterSpacing: 2, marginTop: spacing.xxl },
  field: { gap: spacing.xs },
  fieldLabel: { color: colors.textSecondary, fontSize: typography.caption, fontWeight: '600' },
  flex: { flex: 1 },
  footer: { alignItems: 'center', gap: spacing.sm, marginTop: spacing.xxl },
  footerLink: { color: colors.lavender, fontWeight: '700' },
  footerText: { color: colors.textSecondary, fontSize: typography.body, textAlign: 'center' },
  form: { gap: spacing.md, marginTop: spacing.xl },
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
  primaryBtn: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    justifyContent: 'center',
    marginTop: spacing.xl,
    paddingVertical: spacing.lg,
  },
  primaryBtnText: { color: colors.textPrimary, fontSize: typography.body, fontWeight: '800' },
  secondaryBtn: {
    alignItems: 'center',
    backgroundColor: colors.bgSurface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    paddingVertical: spacing.lg,
  },
  secondaryBtnText: { color: colors.textPrimary, fontSize: typography.body, fontWeight: '700' },
  tagline: { color: colors.textSecondary, fontSize: typography.body, marginTop: spacing.sm },
  title: { color: colors.textPrimary, fontSize: typography.display, fontWeight: '900' },
});
