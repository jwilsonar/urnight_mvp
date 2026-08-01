/** Cuenta: sesión nativa (SD-02) + estado del servicio (health, SD-01). */
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import type { UserProfileResponse } from '@urnight/contracts';
import { fetchHealth, fetchMe } from '../../lib/api-client';
import { useAuth } from '../../lib/auth-context';
import { color, radius, space, type } from '../../lib/theme';
import { Button, Eyebrow, LoadingState } from '../../components/ui';

type ApiStatus = 'checking' | 'ok' | 'down';

export default function AccountScreen() {
  const router = useRouter();
  const { status, claims, signOut, getAccessToken } = useAuth();
  const [apiStatus, setApiStatus] = useState<ApiStatus>('checking');
  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  const check = useCallback(async () => {
    try {
      const health = await fetchHealth();
      setApiStatus(health.status === 'ok' ? 'ok' : 'down');
    } catch {
      setApiStatus('down');
    }
  }, []);

  useEffect(() => {
    void check();
  }, [check]);

  // Perfil completo vía GET /auth/me; si falla se degrada a los claims del token.
  useEffect(() => {
    if (status !== 'authenticated') {
      setProfile(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      const token = await getAccessToken();
      if (!token) return;
      try {
        const me = await fetchMe(token);
        if (!cancelled) setProfile(me);
      } catch {
        if (!cancelled) setProfile(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [status, getAccessToken]);

  async function onSignOut() {
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      setSigningOut(false);
    }
  }

  const statusColor =
    apiStatus === 'ok' ? color.success : apiStatus === 'down' ? color.error : color.smoke;
  const statusLabel =
    apiStatus === 'ok' ? 'Operativo' : apiStatus === 'down' ? 'Sin conexión' : 'Comprobando…';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Eyebrow>Cuenta</Eyebrow>
        <Text style={styles.title}>Tu perfil</Text>
      </View>

      <View style={styles.content}>
        {status === 'restoring' ? (
          <LoadingState label="Recuperando tu sesión…" />
        ) : status === 'authenticated' ? (
          <View style={styles.card}>
            <View style={styles.iconRing}>
              <Ionicons name="person" size={28} color={color.crimson} />
            </View>
            <Text style={styles.cardTitle}>
              {profile?.fullName ?? claims?.email ?? 'Tu cuenta'}
            </Text>
            <Text style={styles.cardSubtitle}>{profile?.email ?? claims?.email ?? ''}</Text>
            <Button
              label={signingOut ? 'Cerrando sesión…' : 'Cerrar sesión'}
              variant="secondary"
              disabled={signingOut}
              onPress={() => void onSignOut()}
              style={styles.cardAction}
            />
          </View>
        ) : (
          <View style={styles.card}>
            <View style={styles.iconRing}>
              <Ionicons name="person-outline" size={28} color={color.smoke} />
            </View>
            <Text style={styles.cardTitle}>Inicia sesión</Text>
            <Text style={styles.cardSubtitle}>
              Entra con tu cuenta de Ravenue para llevar tus entradas y tu noche
              contigo.
            </Text>
            <Button
              label="Ingresar"
              onPress={() => router.push('/login')}
              style={styles.cardAction}
            />
          </View>
        )}

        <View style={styles.rowCard}>
          <Text style={styles.rowLabel}>Estado del servicio</Text>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.rowValue, { color: statusColor }]}>{statusLabel}</Text>
          </View>
        </View>

        <View style={styles.rowCard}>
          <Text style={styles.rowLabel}>Versión</Text>
          <Text style={styles.rowValue}>{Constants.expoConfig?.version ?? '—'}</Text>
        </View>

        <Text style={styles.footer}>Ravenue · La noche de Perú</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: color.bgRoot,
  },
  header: {
    padding: space.s4,
    gap: space.s2,
  },
  title: {
    ...type.h1,
    color: color.textPrimary,
  },
  content: {
    paddingHorizontal: space.s4,
    gap: space.s3,
  },
  card: {
    backgroundColor: color.bgSurface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: color.borderFaint,
    padding: space.s6,
    alignItems: 'center',
    gap: space.s2,
  },
  iconRing: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: color.steel,
    backgroundColor: color.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.s1,
  },
  cardTitle: {
    ...type.h3,
    color: color.textPrimary,
    textAlign: 'center',
  },
  cardSubtitle: {
    ...type.bodySm,
    color: color.textMuted,
    textAlign: 'center',
  },
  cardAction: {
    marginTop: space.s3,
    alignSelf: 'stretch',
  },
  rowCard: {
    backgroundColor: color.bgSurface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: color.borderFaint,
    paddingHorizontal: space.s4,
    paddingVertical: space.s3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowLabel: {
    ...type.bodySm,
    color: color.textSecondary,
  },
  rowValue: {
    ...type.label,
    color: color.textPrimary,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.s2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: radius.pill,
  },
  footer: {
    ...type.caption,
    color: color.textFaint,
    textAlign: 'center',
    marginTop: space.s4,
  },
});
