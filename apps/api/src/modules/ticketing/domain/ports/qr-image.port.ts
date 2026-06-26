/**
 * Puerto OUT: renderiza el contenido de un QR (el token `qrCode` del ticket) a
 * un PNG. La implementación (lib `qrcode`) vive en infraestructura; el caso de
 * uso depende de esta interfaz, no de la librería (ACL §3.2).
 */
export interface QrImagePort {
  /** Genera el PNG del QR que codifica `data`. */
  render(data: string): Promise<Buffer>;
}

export const QR_IMAGE_PORT = Symbol('QR_IMAGE_PORT');
