import type { ZoneResponse } from '@urnight/contracts';
import { createLogger } from './logger';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3101/api/v1';
const log = createLogger('api');

export interface HealthResponse {
  status: string;
  info: Record<string, { status: string }>;
}

/** GET tipado con log de fallo de red (§6). */
async function getJson<T>(path: string, event: string): Promise<T> {
  try {
    const res = await fetch(`${API_URL}${path}`);
    if (!res.ok) {
      log.warn({ path, status: res.status }, `${event}.error`);
    }
    return (await res.json()) as T;
  } catch (err) {
    log.error({ path, err: (err as Error).message }, `${event}.network_error`);
    throw err;
  }
}

/** Cliente tipado hacia el API (tipos compartidos §5). */
export function fetchHealth(): Promise<HealthResponse> {
  return getJson<HealthResponse>('/health', 'mobile.api.health');
}

export function fetchZones(): Promise<ZoneResponse[]> {
  return getJson<ZoneResponse[]>('/zones', 'mobile.api.zones');
}
