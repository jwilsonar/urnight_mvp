'use client';

import { DotsSixVertical, Star, Trash } from '@phosphor-icons/react';
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
import { useState } from 'react';
import { toast } from 'sonner';
import type { LocalImageResponse } from '@urnight/contracts';
import { Badge, Button, Skeleton, cn } from '@urnight/ui';
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
import { uploadToStaging } from '@/lib/api/uploads';

interface UploadItem {
  id: string;
  name: string;
  progress: number;
  error: boolean;
}

interface LocalImagesManagerProps {
  localId: string;
}

/** Galería drag-and-drop del local: subir, reordenar, portada y eliminar. */
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
  });

  const reorder = useApiMutation({
    mutationFn: (orderedIds: string[]) => reorderLocalImages(localId, { orderedIds }, token),
    invalidateKeys: [key],
  });

  function patchUpload(id: string, patch: Partial<UploadItem>) {
    setUploads((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch } : u)));
  }

  async function handleAccepted(files: File[]) {
    if (!token) {
      toast.error('Sesión no disponible. Vuelve a iniciar sesión.');
      return;
    }
    const hadImages = images.length > 0 || uploads.length > 0;
    for (const [i, file] of files.entries()) {
      const item: UploadItem = { id: crypto.randomUUID(), name: file.name, progress: 0, error: false };
      setUploads((prev) => [...prev, item]);
      try {
        const stagingKey = await uploadToStaging(file, 'local', token, (pct) =>
          patchUpload(item.id, { progress: pct }),
        );
        // La primera imagen del local se marca como portada automáticamente.
        const isMain = !hadImages && i === 0;
        await confirmLocalImage(localId, { key: stagingKey, isMain }, token);
        setUploads((prev) => prev.filter((u) => u.id !== item.id));
      } catch (err) {
        patchUpload(item.id, { error: true });
        toast.error(err instanceof Error ? err.message : 'No se pudo subir la imagen.');
      }
    }
    await queryClient.invalidateQueries({ queryKey: key });
    await queryClient.invalidateQueries({ queryKey: queryKeys.myLocals });
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
      <MediaDropzone onAccepted={handleAccepted} />

      {uploads.length > 0 && (
        <ul className="space-y-2">
          {uploads.map((u) => (
            <li key={u.id} className="flex items-center gap-3 text-sm">
              <span className="w-40 truncate text-muted-foreground">{u.name}</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn('h-full rounded-full transition-all', u.error ? 'bg-destructive' : 'bg-primary')}
                  style={{ width: `${u.error ? 100 : u.progress}%` }}
                />
              </div>
              <span className="w-10 text-right text-xs text-muted-foreground">
                {u.error ? 'error' : `${u.progress}%`}
              </span>
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
        <p className="text-sm text-muted-foreground">Aún no hay imágenes. Sube la primera arriba.</p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={images.map((img) => img.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {images.map((image) => (
                <SortableImage
                  key={image.id}
                  image={image}
                  onSetMain={() => setMain.mutate(image.id)}
                  onDelete={() => remove.mutate(image.id)}
                  busy={setMain.isPending || remove.isPending}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
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
      <img src={image.url} alt="" className="h-full w-full object-cover" />

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
