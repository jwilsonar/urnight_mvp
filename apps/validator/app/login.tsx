/** Login del validador (§5): email+contraseña contra POST /auth/login, exige rol validator. */
import { IDENTITY_ERROR_CODES, loginSchema } from '@urnight/contracts';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Eyebrow, Field } from '../components/ui';
import { ApiError, NetworkError } from '../lib/api-client';
import { NotValidatorError } from '../lib/auth';
import { useAuth } from '../lib/auth-context';
import { color, radius, space, type } from '../lib/theme';

interface FieldErrors {
  email?: string;
  password?: string;
}

/** Traduce el fallo del API a copy de UX (códigos problem+json de identidad). */
function messageOf(err: unknown): string {
  if (err instanceof NotValidatorError) {
    return 'Esta cuenta no tiene permisos de validador.';
  }
  if (err instanceof NetworkError) {
    return 'Sin conexión. Verifica la red e inténtalo de nuevo.';
  }
  if (err instanceof ApiError) {
    if (err.code === IDENTITY_ERROR_CODES.INVALID_CREDENTIALS || err.status === 401) {
      return 'Correo o contraseña incorrectos.';
    }
    if (err.code === IDENTITY_ERROR_CODES.ACCOUNT_DISABLED) {
      return 'Tu cuenta está deshabilitada. Escríbenos para reactivarla.';
    }
    if (err.status === 429) {
      return 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.';
    }
    return 'No se pudo iniciar sesión.';
  }
  return 'No se pudo iniciar sesión. Inténtalo de nuevo.';
}

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit() {
    if (pending) return;
    setFormError(null);
    const parsed = loginSchema.safeParse({ email: email.trim(), password });
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      setFieldErrors({
        email: flat.email ? 'Ingresa un correo válido.' : undefined,
        password: flat.password ? 'Ingresa tu contraseña.' : undefined,
      });
      return;
    }
    setFieldErrors({});
    setPending(true);
    try {
      await signIn(parsed.data.email, parsed.data.password);
      // El gate de _layout redirige a "/" al detectar la sesión.
    } catch (err) {
      setFormError(messageOf(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Eyebrow>Puerta · Ravenue</Eyebrow>
            <Text style={styles.title}>Validación de puerta</Text>
            <Text style={styles.subtitle}>Inicia sesión con tu cuenta de validador</Text>
          </View>

          <View style={styles.form}>
            {formError ? (
              <View style={styles.alert}>
                <Text style={styles.alertText}>{formError}</Text>
              </View>
            ) : null}

            <Field
              label="Correo"
              placeholder="tu@correo.com"
              value={email}
              onChangeText={setEmail}
              error={fieldErrors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              editable={!pending}
            />
            <Field
              label="Contraseña"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              error={fieldErrors.password}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="current-password"
              textContentType="password"
              editable={!pending}
              onSubmitEditing={() => void onSubmit()}
              returnKeyType="go"
            />

            <Button
              label={pending ? 'Ingresando…' : 'Ingresar'}
              onPress={() => void onSubmit()}
              disabled={pending || !email || !password}
              style={styles.submit}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: color.bgRoot,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: space.s6,
    gap: space.s8,
  },
  header: {
    gap: space.s2,
  },
  title: {
    ...type.h1,
    color: color.textPrimary,
  },
  subtitle: {
    ...type.body,
    color: color.textSecondary,
  },
  form: {
    gap: space.s4,
  },
  alert: {
    backgroundColor: color.errorSoft,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: color.error,
    padding: space.s3,
  },
  alertText: {
    ...type.bodySm,
    color: color.errorFg,
  },
  submit: {
    marginTop: space.s2,
  },
});
