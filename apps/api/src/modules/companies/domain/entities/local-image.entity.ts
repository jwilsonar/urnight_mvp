/**
 * Imagen de un local (galería). Recurso hijo simple sin invariantes propias
 * (las reglas viven en los casos de uso / repo: exclusividad de portada, orden).
 * Se modela como tipo de lectura plano, no como aggregate (CQRS ligero §3.2).
 */
export interface LocalImage {
  readonly id: string;
  readonly localId: string;
  /** Referencia de almacenamiento: key de S3 (o URL absoluta para externas). */
  readonly storageKey: string;
  readonly isMain: boolean;
  readonly sortOrder: number;
  readonly width: number | null;
  readonly height: number | null;
  readonly sizeBytes: number | null;
  readonly createdAt: Date;
}
