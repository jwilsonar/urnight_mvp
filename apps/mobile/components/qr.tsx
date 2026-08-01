/** QR de una entrada (SD-06). Espejo de apps/web/components/tickets/ticket-qr.tsx. */
import { useEffect, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import QRCode from 'qrcode';
import { SvgXml } from 'react-native-svg';
import { resolveStorageUrl } from '../lib/storage';
import { color, radius } from '../lib/theme';

/**
 * Con red y PNG ya generado en el storage se muestra ese. Sin red, o si el
 * checkout aún no lo subió, se dibuja localmente desde el token `qrCode`, que es
 * la fuente de verdad que valida la puerta. Ambos codifican lo mismo, así que el
 * escaneo funciona igual venga de donde venga.
 *
 * Metro resuelve `qrcode` por su campo `browser`, así que `toString` es puro JS
 * y no arrastra dependencias de Node.
 */
export function TicketQr({
  qrCode,
  qrImageKey,
  online,
  size = 240,
}: {
  qrCode: string;
  qrImageKey: string | null;
  online: boolean;
  size?: number;
}) {
  const remoteUrl = online ? resolveStorageUrl(qrImageKey) : null;
  const [svg, setSvg] = useState<string | null>(null);

  useEffect(() => {
    if (remoteUrl) return;
    let active = true;
    QRCode.toString(qrCode, { type: 'svg', margin: 1, errorCorrectionLevel: 'M' })
      .then((markup) => {
        if (active) setSvg(markup);
      })
      .catch(() => {
        // Sin QR visual: la pantalla muestra el recuadro vacío. No se registra
        // el contenido del token en el log (§6).
      });
    return () => {
      active = false;
    };
  }, [remoteUrl, qrCode]);

  if (remoteUrl) {
    return (
      <Image
        source={{ uri: remoteUrl }}
        style={[styles.box, { width: size, height: size }]}
        resizeMode="contain"
      />
    );
  }

  return (
    <View style={[styles.box, { width: size, height: size }]}>
      {svg ? <SvgXml xml={svg} width={size - 16} height={size - 16} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: color.moon,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
});
