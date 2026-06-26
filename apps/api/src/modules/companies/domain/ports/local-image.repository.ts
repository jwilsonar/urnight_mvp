import type { LocalImage } from '../entities/local-image.entity';

export interface NewLocalImage {
  id: string;
  localId: string;
  storageKey: string;
  isMain: boolean;
  sortOrder: number;
  width: number | null;
  height: number | null;
  sizeBytes: number | null;
}

export interface LocalImageRepository {
  /** Galería de un local ordenada por sort_order asc. */
  listByLocal(localId: string): Promise<LocalImage[]>;
  findById(id: string): Promise<LocalImage | null>;
  create(image: NewLocalImage): Promise<LocalImage>;
  delete(id: string): Promise<void>;
  /** Siguiente sort_order (append al final de la galería). */
  nextSortOrder(localId: string): Promise<number>;
  /** Marca una imagen como portada y desmarca el resto del local (atómico). */
  setMain(localId: string, imageId: string): Promise<void>;
  /** Reordena: sort_order = índice en orderedIds (solo ids del local). */
  reorder(localId: string, orderedIds: string[]): Promise<void>;
}

export const LOCAL_IMAGE_REPOSITORY = Symbol('LOCAL_IMAGE_REPOSITORY');
