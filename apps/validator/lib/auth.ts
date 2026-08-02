import type { AuthTokensResponse } from '@urnight/contracts';
import * as SecureStore from 'expo-secure-store';
import { createLogger } from './logger';

/**
 * Sesión del validador (§2.2 del diseño): el par de tokens emitido por la API
 * se guarda en almacenamiento seguro del dispositivo (Keychain/Keystore). Este
 * fichero contiene SOLO lo que toca plataforma; la lógica de claims y de
 * decisión vive en `session-rules.ts`, que sí se puede probar.
 *
 * `ACCESS_KEY` conserva su valor histórico a propósito: cambiarlo invalidaría
 * la sesión de cualquier dispositivo ya en uso.
 */
const log = createLogger('auth');
const ACCESS_KEY = 'urnight_validator_access_token';
const REFRESH_KEY = 'urnight_validator_refresh_token';

/** La cuenta autenticó pero no tiene rol `validator` → no puede validar en puerta. */
export class NotValidatorError extends Error {
  constructor() {
    super('not_validator');
    this.name = 'NotValidatorError';
  }
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export async function getStoredTokens(): Promise<TokenPair | null> {
  try {
    const [accessToken, refreshToken] = await Promise.all([
      SecureStore.getItemAsync(ACCESS_KEY),
      SecureStore.getItemAsync(REFRESH_KEY),
    ]);
    if (!accessToken || !refreshToken) return null;
    return { accessToken, refreshToken };
  } catch (err) {
    log.warn({ err: (err as Error).message }, 'validator.auth.read_failed');
    return null;
  }
}

export async function storeTokens(tokens: AuthTokensResponse | TokenPair): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync(ACCESS_KEY, tokens.accessToken),
    SecureStore.setItemAsync(REFRESH_KEY, tokens.refreshToken),
  ]);
}

export async function clearTokens(): Promise<void> {
  try {
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS_KEY),
      SecureStore.deleteItemAsync(REFRESH_KEY),
    ]);
  } catch (err) {
    log.warn({ err: (err as Error).message }, 'validator.auth.clear_failed');
  }
}
