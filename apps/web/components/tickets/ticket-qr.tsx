'use client';

import { QrCode as QrIcon } from '@phosphor-icons/react';
import Image from 'next/image';
import QRCode from 'qrcode';
import { useEffect, useState } from 'react';
import { StorageImage } from '@/lib/storage/storage-context';

/**
 * QR de una entrada. Preferimos el PNG ya guardado en S3 (`qrImageKey`,
 * resuelto a URL en presentación). Si aún no se generó —subida best-effort en el
 * checkout—, lo renderizamos en el cliente a partir del token `qrCode`, que es la
 * fuente de verdad que valida la puerta. Ambos codifican el mismo token, así que
 * el escaneo funciona igual venga de donde venga.
 */
export function TicketQr({
  qrImageKey,
  qrCode,
  size = 112,
}: {
  qrImageKey: string | null;
  qrCode: string;
  size?: number;
}) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (qrImageKey) return;
    let active = true;
    QRCode.toDataURL(qrCode, { margin: 1, width: size * 2, errorCorrectionLevel: 'M' })
      .then((url) => {
        if (active) setDataUrl(url);
      })
      .catch(() => {
        /* sin QR visual: queda el token como referencia */
      });
    return () => {
      active = false;
    };
  }, [qrImageKey, qrCode, size]);

  if (qrImageKey) {
    return (
      <StorageImage
        src={qrImageKey}
        alt="Código QR de la entrada"
        width={size}
        height={size}
        className="shrink-0 rounded-md bg-white p-1"
      />
    );
  }

  if (dataUrl) {
    return (
      <Image
        src={dataUrl}
        alt="Código QR de la entrada"
        width={size}
        height={size}
        unoptimized
        className="shrink-0 rounded-md bg-white p-1"
      />
    );
  }

  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-md border bg-muted"
      style={{ width: size, height: size }}
    >
      <QrIcon className="h-10 w-10 text-muted-foreground" weight="duotone" />
    </div>
  );
}
