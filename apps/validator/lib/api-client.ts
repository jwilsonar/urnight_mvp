import { createLogger } from './logger';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3101/api/v1';
const log = createLogger('api');

export interface HealthResponse {
  status: string;
  info: Record<string, { status: string }>;
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

export interface QrValidationResult {
  result: 'valid' | 'already_used' | 'cancelled' | 'invalid';
  ticketId?: string;
  message?: string;
}

/**
 * Valida un QR en puerta (POST /validations/scan, rol validator). Lanza ante
 * fallo de red para que el llamador lo encole offline y reintente.
 */
export async function validateQr(
  qrCode: string,
  token: string,
  localId?: string,
): Promise<QrValidationResult> {
  const res = await fetch(`${API_URL}/validations/scan`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ qrCode, localId }),
  });
  if (!res.ok) {
    log.warn({ path: '/validations/scan', status: res.status }, 'validator.api.validate.error');
    throw new Error(`validate failed: ${res.status}`);
  }
  return (await res.json()) as QrValidationResult;
}
