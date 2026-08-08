/**
 * Enlaces compartibles del promotor. La base pública vive en
 * `shared/config/web-url` (punto ÚNICO §M19, también la usa identidad para el
 * enlace de verificación de correo); antes estaba dispersa entre `share-url.ts`
 * (`/p/<code>`) y `confirm-promoter-association` (`REFERRAL_BASE`).
 */
import { webUrlFor } from '../../../../shared/config/web-url';

/** Enlace corto de compartir de un código de canje: `/p/<code>`. */
export function shareUrlFor(code: string): string {
  return webUrlFor(`/p/${code}`);
}

/** Enlace de referido del promotor: `/r/<code>`. */
export function referralUrlFor(code: string): string {
  return webUrlFor(`/r/${code}`);
}
