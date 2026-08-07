import { IDENTITY_ERROR_CODES } from "@urnight/contracts";
import { ApiError } from "./client";

export type ErrorMessageKey =
  | "invalidCredentials"
  | "underage"
  | "emailAlreadyRegistered"
  | "documentAlreadyRegistered"
  | "accountDisabled"
  | "invalidToken"
  | "unauthorized"
  | "forbidden"
  | "notFound"
  | "conflict"
  | "invalidData"
  | "tooManyRequests"
  | "server"
  | "unavailable"
  | "timeout"
  | "network"
  | "sessionFailed"
  | "mfaChallengePending"
  | "invalidMfaCode"
  | "mfaChallengeExpired"
  | "mfaLocked"
  | "mfaClockDrift"
  | "mfaFactorUnreadable"
  | "unexpected";

export type ErrorMessageTranslator = (key: ErrorMessageKey) => string;

const CODE_MESSAGE_KEYS: Record<string, ErrorMessageKey> = {
  [IDENTITY_ERROR_CODES.INVALID_CREDENTIALS]: "invalidCredentials",
  [IDENTITY_ERROR_CODES.UNDERAGE]: "underage",
  [IDENTITY_ERROR_CODES.EMAIL_ALREADY_REGISTERED]: "emailAlreadyRegistered",
  [IDENTITY_ERROR_CODES.DOCUMENT_ALREADY_REGISTERED]:
    "documentAlreadyRegistered",
  [IDENTITY_ERROR_CODES.ACCOUNT_DISABLED]: "accountDisabled",
  [IDENTITY_ERROR_CODES.INVALID_TOKEN]: "invalidToken",
  [IDENTITY_ERROR_CODES.INVALID_MFA_CODE]: "invalidMfaCode",
  [IDENTITY_ERROR_CODES.MFA_CHALLENGE_EXPIRED]: "mfaChallengeExpired",
  [IDENTITY_ERROR_CODES.MFA_LOCKED]: "mfaLocked",
  [IDENTITY_ERROR_CODES.MFA_CLOCK_DRIFT]: "mfaClockDrift",
  [IDENTITY_ERROR_CODES.MFA_FACTOR_UNREADABLE]: "mfaFactorUnreadable",
};

const STATUS_MESSAGE_KEYS: Record<number, ErrorMessageKey> = {
  401: "unauthorized",
  403: "forbidden",
  404: "notFound",
  409: "conflict",
  422: "invalidData",
  429: "tooManyRequests",
  500: "server",
  503: "unavailable",
};

const FALLBACK_ES: Record<ErrorMessageKey, string> = {
  invalidMfaCode: "El código no es válido. Verifícalo e inténtalo de nuevo.",
  mfaChallengeExpired:
    "El desafío venció. Inicia sesión nuevamente para obtener otro.",
  mfaLocked:
    "Alcanzaste el límite de intentos. Inicia sesión nuevamente más tarde.",
  mfaClockDrift:
    "Tu código es correcto, pero la hora del servidor está desfasada. Avísanos: no es un problema de tu autenticador.",
  mfaFactorUnreadable:
    "No pudimos leer tu verificación en dos pasos. Hay que configurarla de nuevo desde Seguridad.",
  mfaChallengePending:
    "Completa la verificación en dos pasos para continuar.",
  invalidCredentials: "Correo o contraseña incorrectos.",
  underage: "Debes ser mayor de 18 años para registrarte.",
  emailAlreadyRegistered: "Ese correo ya está registrado.",
  documentAlreadyRegistered: "Ese documento ya está registrado.",
  accountDisabled: "Esta cuenta está deshabilitada.",
  invalidToken: "El enlace expiró o no es válido.",
  unauthorized: "No autorizado. Inicia sesión nuevamente.",
  forbidden: "No tienes permisos para realizar esta acción.",
  notFound: "No encontramos lo que buscas.",
  conflict: "La operación entra en conflicto con el estado actual.",
  invalidData: "Revisa los datos ingresados.",
  tooManyRequests:
    "Demasiados intentos. Espera un momento e inténtalo de nuevo.",
  server: "Error del servidor. Inténtalo más tarde.",
  unavailable:
    "El servicio no está disponible temporalmente. Inténtalo en unos minutos.",
  timeout:
    "La solicitud tardó demasiado. Revisa tu conexión e inténtalo de nuevo.",
  network:
    "No pudimos conectar con el servicio. Revisa tu conexión e inténtalo de nuevo.",
  sessionFailed: "No pudimos iniciar tu sesión. Inténtalo de nuevo.",
  unexpected: "Ocurrió un error inesperado.",
};

function message(
  key: ErrorMessageKey,
  translate?: ErrorMessageTranslator,
): string {
  return translate ? translate(key) : FALLBACK_ES[key];
}

/** Convierte cualquier error en un mensaje legible y localizado para la UI. */
export function getErrorMessage(
  err: unknown,
  translate?: ErrorMessageTranslator,
): string {
  if (err instanceof ApiError) {
    const byCode = err.code ? CODE_MESSAGE_KEYS[err.code] : undefined;
    if (byCode) return message(byCode, translate);
    const byStatus = STATUS_MESSAGE_KEYS[err.status];
    if (byStatus) return message(byStatus, translate);
    if (err.problem.detail) return err.problem.detail;
    return err.problem.title;
  }
  // AbortSignal.timeout (apiFetch) lanza DOMException con name TimeoutError;
  // un abort del caller llega como AbortError. Ambos = petición interrumpida.
  if (
    err instanceof DOMException &&
    (err.name === "TimeoutError" || err.name === "AbortError")
  ) {
    return message("timeout", translate);
  }
  if (err instanceof TypeError) return message("network", translate);
  if (err instanceof Error && !translate) return err.message;
  return message("unexpected", translate);
}
