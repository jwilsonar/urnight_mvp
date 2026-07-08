'use client';

import { Button } from '@urnight/ui';
import { MediaDropzone } from '@/components/shared/media-dropzone';
import type { StagedUpload } from '@/lib/hooks/use-staged-upload';
import { StorageImage } from '@/lib/storage/storage-context';

interface StagedImageFieldProps {
  /** Instancia de useStagedUpload del formulario dueño (que lee stagedKey al enviar). */
  upload: StagedUpload;
  /** Imagen actual del recurso (key o URL), mostrada mientras no haya una nueva. */
  currentUrl?: string | null;
  disabled?: boolean;
}

/**
 * Campo de imagen única con drag-and-drop: preview local (blob) o imagen actual,
 * barra de progreso, cancelar/reintentar y el dropzone compartido. El formulario
 * dueño crea el hook (`useStagedUpload(scope)`) y envía `upload.stagedKey`.
 */
export function StagedImageField({ upload, currentUrl, disabled }: StagedImageFieldProps) {
  const busy = upload.status === 'uploading';

  return (
    <div className="space-y-2">
      {upload.previewUrl ? (
        <div className="relative aspect-video overflow-hidden rounded-lg border border-border">
          {/* Blob local: <img> crudo a propósito — un object-URL no pasa por next/image. */}
          <img src={upload.previewUrl} alt="" className="h-full w-full object-cover" />
          {busy ? (
            <div className="absolute inset-x-0 bottom-0 h-1.5 bg-muted">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${upload.progress}%` }}
              />
            </div>
          ) : null}
        </div>
      ) : currentUrl ? (
        <div className="relative aspect-video overflow-hidden rounded-lg border border-border">
          <StorageImage
            src={currentUrl}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, 512px"
            className="object-cover"
          />
        </div>
      ) : null}

      {busy ? (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Subiendo… {upload.progress}%</span>
          <Button type="button" size="sm" variant="ghost" onClick={upload.cancel}>
            Cancelar
          </Button>
        </div>
      ) : null}

      {upload.status === 'error' ? (
        <div className="flex items-center justify-between rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <span>La subida falló.</span>
          <div className="flex gap-2">
            <Button type="button" size="sm" variant="outline" onClick={upload.retry}>
              Reintentar
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={upload.reset}>
              Quitar
            </Button>
          </div>
        </div>
      ) : null}

      {upload.status === 'done' ? (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Nueva imagen lista. Se aplicará al guardar.</span>
          <Button type="button" size="sm" variant="ghost" onClick={upload.reset}>
            Quitar
          </Button>
        </div>
      ) : null}

      <MediaDropzone
        maxFiles={1}
        disabled={disabled || busy}
        onAccepted={(files) => {
          const [file] = files;
          if (file) upload.accept(file);
        }}
      />
    </div>
  );
}
