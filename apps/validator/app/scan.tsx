import { CameraView, useCameraPermissions } from 'expo-camera';
import { useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import { queueCheckin } from '../lib/offline-cache';
import { createLogger } from '../lib/logger';

const log = createLogger('scan');

/**
 * Escaneo de QR en puerta (expo-camera; expo-barcode-scanner fue eliminado en
 * SDK 52). El check-in se encola offline y se sincroniza al recuperar red.
 */
export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [lastCode, setLastCode] = useState<string | null>(null);

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

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={({ data }) => {
          if (data === lastCode) return;
          setLastCode(data);
          // Solo metadatos: el contenido del QR nunca se loguea (§6).
          log.info({ length: data.length }, 'validator.qr.scanned');
          void queueCheckin(data).catch((err) =>
            log.error({ err: (err as Error).message }, 'validator.checkin.queue_failed'),
          );
        }}
      />
      <Text style={styles.result}>{lastCode ? `Último QR: ${lastCode}` : 'Apunta a un QR…'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  camera: { flex: 1 },
  msg: { textAlign: 'center' },
  result: { padding: 16, textAlign: 'center' },
});
