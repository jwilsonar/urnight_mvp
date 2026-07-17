'use client';

import { DotsSixVertical, ImageSquare, Star, Trash } from '@phosphor-icons/react';
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import type { LocalImageResponse } from '@urnight/contracts';
import { Badge, Button, Skeleton, cn } from '@urnight/ui';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { EmptyState } from '@/components/shared/empty-state';
import { MediaDropzone } from '@/components/shared/media-dropzone';
import {
  confirmLocalImage,
  deleteLocalImage,
  listLocalImages,
  reorderLocalImages,
  setMainLocalImage,
} from '@/lib/api/local-images';
import { queryKeys } from '@/lib/api/query-keys';
import { useApiMutation } from '@/lib/api/use-api-mutation';
import { isAbortError, uploadToStaging } from '@/lib/api/uploads';
import { readImageSize } from '@/lib/utils/image';
import { StorageImage } from '@/lib/storage/storage-context';

interface UploadItem {
  id: string;
  file: File;
  name: string;
  /** Object-URL local para el thumbnail durante la subida. */
  previewUrl: string;
  progress: number;
  status: 'uploading' | 'error';
  /** Se decidió al aceptar el archivo (primera imagen del local = portada). */
  isMain: boolean;
  controller: AbortController;
}

interface LocalImagesManagerProps {
  localId: string;
}

/** Galería drag-and-drop del local: subir (con cancelar/reintentar), reordenar, portada y eliminar. */
export function LocalImagesManager({ localId }: LocalImagesManagerProps) {
  const { data: session } = useSession();
  const token = session?.accessToken ?? '';
  const queryClient = useQueryClient();
  const key = queryKeys.localImages(localId);

  const { data: images = [], isLoading } = useQuery({
    queryKey: key,
    queryFn: () => listLocalImages(token, localId),
    enabled: Boolean(token),
  });

  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [deleting, setDeleting] = useState<LocalImageResponse | null>(null);
  const dropzoneRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const setMain = useApiMutation({
    mutationFn: (imageId: string) => setMainLocalImage(localId, imageId, token),
    successMessage: 'Portada actualizada.',
    invalidateKeys: [key, queryKeys.myLocals],
  });

  const remove = useApiMutation({
    mutationFn: (imageId: string) => deleteLocalImage(localId, imageId, token),
    successMessage: 'Imagen eliminada.',
    invalidateKeys: [key, queryKeys.myLocals],
    onSuccess: () => setDeleting(null),
  });

  const reorder = useApiMutation({
    mutationFn: (orderedIds: string[]) => reorderLocalImages(localId, { orderedIds }, token),
    invalidateKeys: [key],
  });

  function patchUpload(id: string, patch: Partial<UploadItem>) {
    setUploads((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch } : u)));
  }

  function removeUpload(id: string) {
    setUploads((prev) => {
      const item = prev.find((u) => u.id === id);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((u) => u.id !== id);
    });
  }

  /** Sube y confirma UN ítem. Reutilizado por la soltada inicial y el retry. */
  async function uploadOne(item: UploadItem) {
    try {
      const stagingKey = await uploadToStaging(
        item.file,
        'local',
        token,
        (pct) => patchUpload(item.id, { progress: pct }),
        item.controller.signal,
      );
      // width/height son metadatos opcionales del confirm (best-effort).
      const size = await readImageSize(item.file);
      await confirmLocalImage(localId, { key: stagingKey, isMain: item.isMain, ...(size ?? {}) }, token);
      removeUpload(item.id);
      await queryClient.invalidateQueries({ queryKey: key });
      await queryClient.invalidateQueries({ queryKey: queryKeys.myLocals });
    } catch (err) {
      // Cancelación deliberada: se retira el ítem sin toast de error.
      if (isAbortError(err)) {
        removeUpload(item.id);
        return;
      }
      patchUpload(item.id, { status: 'error' });
      toast.error(err instanceof Error ? err.message : 'No se pudo subir la imagen.');
    }
  }

  async function handleAccepted(files: File[]) {
    if (!token) {
      toast.error('Sesión no disponible. Vuelve a iniciar sesión.');
      return;
    }
    const hadImages = images.length > 0 || uploads.length > 0;
    const items: UploadItem[] = files.map((file, i) => ({
      id: crypto.randomUUID(),
      file,
      name: file.name,
      previewUrl: URL.createObjectURL(file),
      progress: 0,
      status: 'uploading',
      // La primera imagen del local se marca como portada automáticamente.
      isMain: !hadImages && i === 0,
      controller: new AbortController(),
    }));
    setUploads((prev) => [...prev, ...items]);
    for (const item of items) await uploadOne(item);
  }

  function retryUpload(item: UploadItem) {
    const next: UploadItem = { ...item, controller: new AbortController(), status: 'uploading', progress: 0 };
    setUploads((prev) => prev.map((u) => (u.id === item.id ? next : u)));
    void uploadOne(next);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = images.map((img) => img.id);
    const oldIndex = ids.indexOf(active.id as string);
    const newIndex = ids.indexOf(over.id as string);
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(images, oldIndex, newIndex);
    queryClient.setQueryData(key, next); // optimista
    reorder.mutate(next.map((img) => img.id));
  }

  return (
    <div className="space-y-4">
      <div ref={dropzoneRef}>
        <MediaDropzone onAccepted={handleAccepted} />
      </div>

      {uploads.length > 0 && (
        <ul className="space-y-2">
          {uploads.map((u) => (
            <li key={u.id} className="flex items-center gap-3 text-sm">
              {/* Blob local: <img> crudo a propósito — no pasa por next/image. */}
              <img src={u.previewUrl} alt="" className="h-10 w-16 shrink-0 rounded object-cover" />
              <span className="w-28 truncate text-muted-foreground">{u.name}</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    u.status === 'error' ? 'bg-destructive' : 'bg-primary',
                  )}
                  style={{ width: `${u.status === 'error' ? 100 : u.progress}%` }}
                />
              </div>
              {u.status === 'error' ? (
                <div className="flex shrink-0 gap-1">
                  <Button type="button" size="sm" variant="outline" className="h-7 px-2" onClick={() => retryUpload(u)}>
                    Reintentar
                  </Button>
                  <Button type="button" size="sm" variant="ghost" className="h-7 px-2" onClick={() => removeUpload(u.id)}>
                    Quitar
                  </Button>
                </div>
              ) : (
                <>
                  <span className="w-10 text-right text-xs text-muted-foreground">{u.progress}%</span>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-7 shrink-0 px-2"
                    onClick={() => u.controller.abort()}
                  >
                    Cancelar
                  </Button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="aspect-video w-full rounded-lg" />
          ))}
        </div>
      ) : images.length === 0 ? (
        <EmptyState
          icon={<ImageSquare weight="duotone" />}
          title="Aún no hay imágenes"
          description="Sube la primera imagen de la galería."
          action={
            <Button
              type="button"
              onClick={() =>
                dropzoneRef.current?.querySelector<HTMLInputElement>('input[type="file"]')?.click()
              }
            >
              Subir imagen
            </Button>
          }
        />
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={images.map((img) => img.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {images.map((image) => (
                <SortableImage
                  key={image.id}
                  image={image}
                  onSetMain={() => setMain.mutate(image.id)}
                  onDelete={() => setDeleting(image)}
                  busy={setMain.isPending || remove.isPending}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(next) => {
          if (!next) setDeleting(null);
        }}
        title="¿Eliminar esta imagen?"
        description="Se elimina también del almacenamiento. Esta acción no se puede deshacer."
        pending={remove.isPending}
        onConfirm={() => {
          if (deleting) remove.mutate(deleting.id);
        }}
      />
    </div>
  );
}

interface SortableImageProps {
  image: LocalImageResponse;
  onSetMain: () => void;
  onDelete: () => void;
  busy: boolean;
}

function SortableImage({ image, onSetMain, onDelete, busy }: SortableImageProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: image.id,
  });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative aspect-video overflow-hidden rounded-lg border bg-muted',
        isDragging && 'z-10 opacity-70 ring-2 ring-primary',
      )}
    >
      {/* StorageImage resuelve keys/URLs del storage y decide `unoptimized` (dev http). */}
      <StorageImage
        src={image.url}
        alt="Imagen de la galería del local"
        fill
        sizes="(max-width: 640px) 50vw, 25vw"
        className="object-cover"
      />

      {image.isMain && (
        <Badge className="absolute left-1.5 top-1.5 gap-1">
          <Star className="h-3 w-3" weight="fill" /> Portada
        </Badge>
      )}

      {/* Asa de arrastre */}
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label="Arrastrar para reordenar"
        className="absolute right-1.5 top-1.5 cursor-grab rounded bg-background/80 p-1 opacity-0 transition-opacity group-hover:opacity-100"
      >
        <DotsSixVertical className="h-4 w-4" />
      </button>

      {/* Acciones */}
      <div className="absolute inset-x-1.5 bottom-1.5 flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        {!image.isMain && (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="h-7 px-2"
            disabled={busy}
            onClick={onSetMain}
          >
            <Star className="h-3.5 w-3.5" /> Portada
          </Button>
        )}
        <Button
          type="button"
          size="sm"
          variant="destructive"
          className="h-7 w-7 p-0"
          disabled={busy}
          onClick={onDelete}
          aria-label="Eliminar imagen"
        >
          <Trash className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
