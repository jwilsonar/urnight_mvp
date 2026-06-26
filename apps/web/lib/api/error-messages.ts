import { ApiError } from './client';

/** Mensajes localizados (es-PE) por código de dominio del backend. */
const CODE_MESSAGES: Record<string, string> = {
  'identity/invalid_credentials': 'Correo o contraseña incorrectos.',
  'identity/underage': 'Debes ser mayor de 18 años para registrarte.',
  'identity/email_taken': 'Ese correo ya está registrado.',
  'identity/email_not_verified': 'Verifica tu correo antes de continuar.',
  'identity/invalid_token': 'El enlace expiró o no es válido.',
};

/** Mensajes localizados por código HTTP cuando no hay `code` de dominio. */
const STATUS_MESSAGES: Record<number, string> = {
  401: 'No autorizado. Inicia sesión nuevamente.',
  403: 'No tienes permisos para realizar esta acción.',
  404: 'No encontramos lo que buscas.',
  409: 'La operación entra en conflicto con el estado actual.',
  422: 'Revisa los datos ingresados.',
  429: 'Demasiados intentos. Espera un momento e inténtalo de nuevo.',
  500: 'Error del servidor. Inténtalo más tarde.',
  503: 'Servicio no disponible. Inténtalo más tarde.',
};

/** Convierte cualquier error en un mensaje legible y localizado para la UI. */
export function getErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    const byCode = err.code ? CODE_MESSAGES[err.code] : undefined;
    if (byCode) return byCode;
    if (err.problem.detail) return err.problem.detail;
    const byStatus = STATUS_MESSAGES[err.status];
    if (byStatus) return byStatus;
    return err.problem.title;
  }
  if (err instanceof Error) return err.message;
  return 'Ocurrió un error inesperado.';
}
