import { ACCEPTED_IMAGE_TYPES, MAX_IMAGE_BYTES } from '@urnight/contracts';
import {
  ObjectNotFoundError,
  type StoragePort,
} from '../../../../shared/adapters/storage/storage.port';
import { EventFlyerInvalidError, EventFlyerNotFoundError } from '../../domain/errors/events.errors';

/**
 * Verificación y promoción de flyers subidos a staging (tmp/). Compartido por
 * CreateEvent y UpdateEvent: la validación es server-side (HEAD contra el
 * storage) porque el cliente no es confiable (§5).
 */

/**
 * Valida que la key sea de staging y que el objeto real respete tipo/tamaño.
 * Un objeto inválido se elimina de staging antes de lanzar el error de dominio.
 */
export async function validateStagedFlyer(
  storage: StoragePort,
  stagingKey: string,
): Promise<void> {
  if (!stagingKey.startsWith('tmp/')) {
    throw new EventFlyerInvalidError('La key de subida no es de staging.');
  }

  let meta;
  try {
    meta = await storage.headObject(stagingKey);
  } catch (err) {
    if (err instanceof ObjectNotFoundError) throw new EventFlyerNotFoundError();
    throw err;
  }
  if (meta.sizeBytes > MAX_IMAGE_BYTES) {
    await storage.deleteObject(stagingKey);
    throw new EventFlyerInvalidError('La imagen supera el tamaño máximo permitido.');
  }
  if (!(ACCEPTED_IMAGE_TYPES as readonly string[]).includes(meta.contentType ?? '')) {
    await storage.deleteObject(stagingKey);
    throw new EventFlyerInvalidError('Tipo de imagen no permitido.');
  }
}

/**
 * Valida y promueve `tmp/{file}` → `events/{eventId}/{file}`.
 * Devuelve la key final (se persiste la KEY, no la URL — §3.2).
 */
export async function promoteStagedFlyer(
  storage: StoragePort,
  eventId: string,
  stagingKey: string,
): Promise<string> {
  await validateStagedFlyer(storage, stagingKey);
  const filename = stagingKey.slice('tmp/'.length);
  const finalKey = `events/${eventId}/${filename}`;
  await storage.copyObject(stagingKey, finalKey);
  await storage.deleteObject(stagingKey);
  return finalKey;
}
