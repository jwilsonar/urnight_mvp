import { Injectable } from '@nestjs/common';
import QRCode from 'qrcode';
import type { QrImagePort } from '../../domain/ports/qr-image.port';

/**
 * Adapter del QrImagePort con la librería `qrcode`. PNG con margen mínimo y
 * corrección de errores media (M) — balance tamaño/robustez para escaneo en
 * puerta. Devuelve el buffer para subir vía StoragePort.
 */
@Injectable()
export class QrcodeImageAdapter implements QrImagePort {
  render(data: string): Promise<Buffer> {
    return QRCode.toBuffer(data, {
      type: 'png',
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 512,
    });
  }
}
