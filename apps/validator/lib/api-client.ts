import type { AuthTokensResponse, QrValidationResponse } from '@urnight/contracts';
import { createLogger } from './logger';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3101/api/v1';
const log = createLogger('api');

export interface HealthResponse {
  status: string;
  info: Record<string, { status: string }>;
}

/**
 * Error de RED (el fetch nunca llegó a obtener respuesta del servidor): sin
 * conexión, DNS, timeout… Es la señal para encolar offline y reintentar (§5).
 * Un `ApiError` (respuesta HTTP no-2xx) NO debe encolarse: el servidor sí
 * respondió (401 token inválido, 5xx, etc.).
 */
export class NetworkError extends Error {
  constructor(cause?: unknown) {
    super('network_error');
    this.name = 'NetworkError';
    if (cause instanceof Error) this.cause = cause;
  }
}

/** Respuesta HTTP no-2xx del servidor. */
export class ApiError extends Error {
  constructor(readonly status: number) {
    super(`api_error: ${status}`);
    this.name = 'ApiError';
  }
}

export async function fetchHealth(): Promise<HealthResponse> {
  try {
    const res = await fetch(`${API_URL}/health`);
    if (!res.ok) log.warn({ path: '/health', status: res.status }, 'validator.api.health.error');
    return (await res.json()) as HealthResponse;
  } catch (err) {
    log.error({ path: '/health', err: (err as Error).message }, 'validator.api.health.network_error');
    throw err;
  }
}

/**
 * Login del validador (POST /auth/login). Devuelve el par de tokens de la API.
 * Lanza `NetworkError` si no hay red y `ApiError` si el servidor rechaza
 * (401 credenciales inválidas). NUNCA logueamos la contraseña (§6).
 */
export async function login(email: string, password: string): Promise<AuthTokensResponse> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
  } catch (err) {
    log.warn({ path: '/auth/login' }, 'validator.api.login.network_error');
    throw new NetworkError(err);
  }
  if (!res.ok) {
    log.warn({ path: '/auth/login', status: res.status }, 'validator.api.login.error');
    throw new ApiError(res.status);
  }
  return (await res.json()) as AuthTokensResponse;
}

/**
 * Valida un QR en puerta (POST /validations/scan, rol validator). Devuelve el
 * veredicto del backend (valid | already_used | cancelled | invalid). Lanza
 * `NetworkError` SOLO ante fallo de red (para encolar offline, §5) y `ApiError`
 * si el servidor responde con estado no-2xx (p. ej. 401 token expirado). NUNCA
 * logueamos el contenido del QR (§6).
 */
export async function validateQr(
  qrCode: string,
  token: string,
  localId?: string,
): Promise<QrValidationResponse> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/validations/scan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      // TODO(scannedAt): ValidateQrDto en @urnight/contracts no acepta `scannedAt`
      // (otro dueño). Cuando se añada, propagar la hora real del escaneo aquí;
      // mientras, se persiste en la fila offline local (offline-cache.ts).
      body: JSON.stringify({ qrCode, localId }),
    });
  } catch (err) {
    log.warn({ path: '/validations/scan' }, 'validator.api.validate.network_error');
    throw new NetworkError(err);
  }
  if (!res.ok) {
    log.warn({ path: '/validations/scan', status: res.status }, 'validator.api.validate.error');
    throw new ApiError(res.status);
  }
  return (await res.json()) as QrValidationResponse;
}
