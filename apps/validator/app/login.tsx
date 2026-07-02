import { useState } from 'react';
import {
  ActivityIndicator,
  Button,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ApiError, NetworkError } from '../lib/api-client';
import { NotValidatorError } from '../lib/auth';
import { useAuth } from '../lib/auth-context';

/**
 * Login del validador (§5). Autentica contra POST /auth/login, exige rol
 * `validator` y guarda el token en almacenamiento seguro. Sin token, el gate
 * de _layout redirige aquí.
 */
export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await signIn(email.trim(), password);
      // El gate de _layout redirige a "/" al detectar la sesión.
    } catch (err) {
      if (err instanceof NotValidatorError) {
        setError('Esta cuenta no tiene permisos de validador.');
      } else if (err instanceof NetworkError) {
        setError('Sin conexión. Verifica la red e inténtalo de nuevo.');
      } else if (err instanceof ApiError && err.status === 401) {
        setError('Correo o contraseña incorrectos.');
      } else {
        setError('No se pudo iniciar sesión. Inténtalo de nuevo.');
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Validación de puerta</Text>
      <Text style={styles.subtitle}>Inicia sesión con tu cuenta de validador</Text>

      <TextInput
        style={styles.input}
        placeholder="Correo"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        textContentType="emailAddress"
        value={email}
        onChangeText={setEmail}
        editable={!busy}
      />
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        secureTextEntry
        textContentType="password"
        value={password}
        onChangeText={setPassword}
        editable={!busy}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {busy ? (
        <ActivityIndicator style={styles.spinner} />
      ) : (
        <Button title="Ingresar" onPress={onSubmit} disabled={!email || !password} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, gap: 12 },
  title: { fontSize: 26, fontWeight: '700', textAlign: 'center' },
  subtitle: { color: '#52525b', textAlign: 'center', marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#d4d4d8',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  error: { color: '#dc2626', textAlign: 'center' },
  spinner: { marginTop: 8 },
});
