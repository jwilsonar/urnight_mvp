/**
 * Puerto de almacenamiento de objetos del Worker (§ storage). Sube el PDF de
 * entradas. El adapter real (S3/putObject) se conecta sin tocar los processors.
 */
export abstract class StoragePort {
  abstract putObject(key: string, body: Buffer, contentType: string): Promise<string>;
}
