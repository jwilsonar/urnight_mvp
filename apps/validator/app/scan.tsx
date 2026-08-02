import type { QrValidationResponse } from '@urnight/contracts';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import { ApiError, NetworkError, validateQr } from '../lib/api-client';
import { useAuth } from '../lib/auth-context';
import { createLogger } from '../lib/logger';
import { queueCheckin } from '../lib/offline-cache';

const log = createLogger('scan');

type Verdict = QrValidationResponse['result'] | 'offline' | 'error';

interface ScanOutcome {
  verdict: Verdict;
  message: string;
}

const PALETTE: Record<Verdict, { bg: string; label: string }> = {
  valid: { bg: '#16a34a', label: 'Acceso permitido' },
  already_used: { bg: '#dc2626', label: 'Ya usada' },
  cancelled: { bg: '#dc2626', label: 'Cancelada' },
  invalid: { bg: '#dc2626', label: 'Inválida' },
  offline: { bg: '#d97706', label: 'Guardado offline' },
  error: { bg: '#dc2626', label: 'Error' },
};

/**
 * Escaneo de QR en puerta (§5). Online-first: valida contra la API y muestra el
 * veredicto; sólo ante fallo de RED encola offline para sincronizar al recuperar
 * conexión. El contenido del QR nunca se pinta ni se loguea (§6).
 */
export default function ScanScreen() {
  const { getAccessToken, refreshAccessToken, signOut } = useAuth();
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [lastCode, setLastCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [outcome, setOutcome] = useState<ScanOutcome | null>(null);

  /** Encola el escaneo y deja el aviso ámbar en pantalla. */
  async function queueOffline(code: string, scannedAt: string) {
    await queueCheckin(code, scannedAt).catch((e) =>
      log.error({ err: (e as Error).message }, 'validator.checkin.queue_failed'),
    );
    setOutcome({
      verdict: 'offline',
      message: 'Sin conexión. Se sincronizará al recuperar red.',
    });
  }

  async function handleScan(data: string) {
    if (busy || data === lastCode) return;
    setBusy(true);
    setLastCode(data);
    // Solo metadatos: el contenido del QR nunca se loguea (§6).
    log.info({ length: data.length }, 'validator.qr.scanned');
    const scannedAt = new Date().toISOString();
    try {
      const token = await getAccessToken();
      if (!token) {
        // Sin token utilizable. O no hubo red para renovar —y entonces la puerta
        // sigue operando encolando (§2.5)— o la sesión murió, en cuyo caso el
        // gate de _layout ya está llevando a login.
        await queueOffline(data, scannedAt);
        return;
      }
      const res = await validateQr(data, token);
      log.info({ result: res.result }, 'validator.qr.validated');
      setOutcome({ verdict: res.result, message: res.message });
    } catch (err) {
      if (err instanceof NetworkError) {
        // Sin red: encolar offline y sincronizar al recuperar conexión (§5).
        await queueOffline(data, scannedAt);
      } else if (err instanceof ApiError && err.status === 401) {
        // El servidor rechazó el access aunque no hubiera expirado (revocado):
        // renovar a la fuerza y reintentar UNA vez (§2.6).
        log.warn({}, 'validator.qr.unauthorized');
        const fresh = await refreshAccessToken();
        if (!fresh) {
          await queueOffline(data, scannedAt);
          return;
        }
        try {
          const res = await validateQr(data, fresh);
          log.info({ result: res.result }, 'validator.qr.validated');
          setOutcome({ verdict: res.result, message: res.message });
        } catch (retryErr) {
          if (retryErr instanceof NetworkError) {
            await queueOffline(data, scannedAt);
          } else {
            log.warn({}, 'validator.qr.session_dead');
            await signOut();
            router.replace('/login');
          }
        }
      } else {
        log.error({ err: (err as Error).message }, 'validator.qr.validate_failed');
        setOutcome({ verdict: 'error', message: 'No se pudo validar. Inténtalo de nuevo.' });
      }
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setLastCode(null);
    setOutcome(null);
  }

  if (!permission) {
    return <View style={styles.center} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.msg}>Se necesita permiso de cámara para escanear.</Text>
        <Button title="Permitir cámara" onPress={requestPermission} />
      </View>
    );
  }

  const palette = outcome ? PALETTE[outcome.verdict] : null;

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={({ data }) => void handleScan(data)}
      />
      {palette ? (
        <View style={[styles.banner, { backgroundColor: palette.bg }]}>
          <Text style={styles.bannerLabel}>{palette.label}</Text>
          {outcome ? <Text style={styles.bannerMsg}>{outcome.message}</Text> : null}
          {lastCode ? <Text style={styles.bannerRef}>Ref ····{lastCode.slice(-4)}</Text> : null}
          <View style={styles.bannerBtn}>
            <Button title="Escanear otro" color="#ffffff" onPress={reset} disabled={busy} />
          </View>
        </View>
      ) : (
        <Text style={styles.result}>{busy ? 'Validando…' : 'Apunta a un QR…'}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  camera: { flex: 1 },
  msg: { textAlign: 'center' },
  result: { padding: 16, textAlign: 'center' },
  banner: { padding: 20, alignItems: 'center', gap: 6 },
  bannerLabel: { color: '#ffffff', fontSize: 22, fontWeight: '700' },
  bannerMsg: { color: '#ffffff', textAlign: 'center' },
  bannerRef: { color: '#ffffff', opacity: 0.85, fontSize: 12 },
  bannerBtn: { marginTop: 8 },
});
