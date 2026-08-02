import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../components/ui';
import { ApiError, NetworkError, validateQr } from '../lib/api-client';
import { useAuth } from '../lib/auth-context';
import { createLogger } from '../lib/logger';
import { queueCheckin } from '../lib/offline-cache';
import {
  shouldIgnoreScan,
  VERDICT_AUTOCLOSE_MS,
  VERDICT_STYLES,
  type LastScan,
  type Verdict,
} from '../lib/scan-rules';
import { color, radius, space, type } from '../lib/theme';

const log = createLogger('scan');

const HAPTIC: Record<'success' | 'warning' | 'error', Haptics.NotificationFeedbackType> = {
  success: Haptics.NotificationFeedbackType.Success,
  warning: Haptics.NotificationFeedbackType.Warning,
  error: Haptics.NotificationFeedbackType.Error,
};

interface ScanOutcome {
  verdict: Verdict;
  message: string;
  /** Últimos 4 del código, para que el validador pueda referirse al ticket. */
  ref: string;
}

/**
 * Escaneo de QR en puerta (§5). Online-first: valida contra la API y muestra el
 * veredicto a pantalla completa; sólo ante fallo de RED encola offline para
 * sincronizar al recuperar conexión. El contenido del QR nunca se pinta entero
 * ni se loguea (§6).
 */
export default function ScanScreen() {
  const { getAccessToken, refreshAccessToken, signOut } = useAuth();
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [busy, setBusy] = useState(false);
  const [outcome, setOutcome] = useState<ScanOutcome | null>(null);
  const lastScan = useRef<LastScan | null>(null);
  const progress = useRef(new Animated.Value(1)).current;

  const reset = useCallback(() => {
    setOutcome(null);
  }, []);

  // Háptica al aparecer el veredicto, y auto-cierre solo si toca (§3.5).
  useEffect(() => {
    if (!outcome) return;
    const style = VERDICT_STYLES[outcome.verdict];
    void Haptics.notificationAsync(HAPTIC[style.haptic]);
    if (!style.autoClose) return;
    progress.setValue(1);
    Animated.timing(progress, {
      toValue: 0,
      duration: VERDICT_AUTOCLOSE_MS,
      useNativeDriver: true,
    }).start();
    const timer = setTimeout(reset, VERDICT_AUTOCLOSE_MS);
    return () => clearTimeout(timer);
  }, [outcome, progress, reset]);

  /** Encola el escaneo y deja el aviso ámbar en pantalla. */
  async function queueOffline(code: string, scannedAt: string) {
    await queueCheckin(code, scannedAt).catch((e) =>
      log.error({ err: (e as Error).message }, 'validator.checkin.queue_failed'),
    );
    setOutcome({
      verdict: 'offline',
      message: 'Sin conexión. Se sincronizará al recuperar red.',
      ref: code.slice(-4),
    });
  }

  async function handleScan(data: string) {
    const now = Date.now();
    if (busy || shouldIgnoreScan(data, lastScan.current, now)) return;
    setBusy(true);
    lastScan.current = { code: data, at: now };
    // Solo metadatos: el contenido del QR nunca se loguea (§6).
    log.info({ length: data.length }, 'validator.qr.scanned');
    const scannedAt = new Date().toISOString();
    const ref = data.slice(-4);
    try {
      const token = await getAccessToken();
      if (!token) {
        // O no hubo red para renovar —y la puerta sigue operando encolando— o la
        // sesión murió, en cuyo caso el gate de _layout ya lleva a login.
        await queueOffline(data, scannedAt);
        return;
      }
      const res = await validateQr(data, token);
      log.info({ result: res.result }, 'validator.qr.validated');
      setOutcome({ verdict: res.result, message: res.message, ref });
    } catch (err) {
      if (err instanceof NetworkError) {
        await queueOffline(data, scannedAt);
      } else if (err instanceof ApiError && err.status === 401) {
        // El servidor rechazó un access que no había expirado (revocado):
        // renovar a la fuerza y reintentar UNA vez.
        log.warn({}, 'validator.qr.unauthorized');
        const fresh = await refreshAccessToken();
        if (!fresh) {
          await queueOffline(data, scannedAt);
          return;
        }
        try {
          const res = await validateQr(data, fresh);
          log.info({ result: res.result }, 'validator.qr.validated');
          setOutcome({ verdict: res.result, message: res.message, ref });
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
        setOutcome({
          verdict: 'error',
          message: 'No se pudo validar. Inténtalo de nuevo.',
          ref,
        });
      }
    } finally {
      setBusy(false);
    }
  }

  if (!permission) {
    return <View style={styles.center} />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.permissionText}>Se necesita permiso de cámara para escanear.</Text>
        <Button label="Permitir cámara" onPress={() => void requestPermission()} />
      </SafeAreaView>
    );
  }

  if (outcome) {
    const style = VERDICT_STYLES[outcome.verdict];
    return (
      <SafeAreaView style={[styles.verdict, { backgroundColor: style.background }]}>
        <Text style={[styles.mark, { color: style.foreground }]}>{style.mark}</Text>
        <Text style={[styles.verdictLabel, { color: style.foreground }]}>{style.label}</Text>
        <Text style={[styles.verdictMessage, { color: style.foreground }]}>{outcome.message}</Text>
        <Text style={[styles.verdictRef, { color: style.foreground }]}>Ref ····{outcome.ref}</Text>
        {style.autoClose ? (
          <View style={styles.progressTrack}>
            <Animated.View
              style={[
                styles.progressBar,
                { backgroundColor: style.foreground, transform: [{ scaleX: progress }] },
              ]}
            />
          </View>
        ) : (
          <Button
            label="Escanear otro"
            variant="secondary"
            onPress={reset}
            disabled={busy}
            style={styles.verdictAction}
          />
        )}
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={({ data }) => void handleScan(data)}
      />
      <View style={styles.hintBar} pointerEvents="none">
        <Text style={styles.hint}>{busy ? 'Validando…' : 'Apunta a un QR…'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: color.bgRoot,
  },
  camera: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.s4,
    padding: space.s6,
    backgroundColor: color.bgRoot,
  },
  permissionText: {
    ...type.body,
    color: color.textSecondary,
    textAlign: 'center',
  },
  hintBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingVertical: space.s6,
    backgroundColor: color.bgRoot,
  },
  hint: {
    ...type.title,
    color: color.textSecondary,
    textAlign: 'center',
  },
  verdict: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.s6,
    gap: space.s2,
  },
  mark: {
    fontSize: 96,
    lineHeight: 104,
    fontWeight: '800',
  },
  verdictLabel: {
    ...type.h1,
    textAlign: 'center',
  },
  verdictMessage: {
    ...type.body,
    textAlign: 'center',
    opacity: 0.9,
  },
  verdictRef: {
    ...type.caption,
    opacity: 0.75,
    marginTop: space.s2,
  },
  verdictAction: {
    marginTop: space.s8,
  },
  progressTrack: {
    marginTop: space.s8,
    height: 4,
    width: '60%',
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  progressBar: {
    height: 4,
    width: '100%',
    borderRadius: radius.pill,
    // Sin esto la barra encoge desde el centro y no se lee como cuenta atrás.
    transformOrigin: 'left',
  },
});
