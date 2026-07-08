'use client';

import { useSession } from 'next-auth/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import type { UploadScope } from '@urnight/contracts';
import { getErrorMessage } from '@/lib/api/error-messages';
import { isAbortError, uploadToStaging } from '@/lib/api/uploads';
import { SESSION_EXPIRED } from '@/lib/constants';

export type StagedUploadStatus = 'idle' | 'uploading' | 'done' | 'error';

export interface StagedUpload {
  /** Key de staging (tmp/…) lista para enviar como flyerKey / confirmar en galería. */
  stagedKey: string | null;
  /** Archivo elegido (para metadatos como width/height al confirmar). */
  file: File | null;
  /** Object-URL local del archivo elegido (preview inmediata, sin red). */
  previewUrl: string | null;
  progress: number;
  status: StagedUploadStatus;
  /** Recibe el archivo aceptado por el dropzone y lo sube a staging. */
  accept: (file: File) => void;
  /** Aborta la subida en vuelo y vuelve a idle. */
  cancel: () => void;
  /** Re-sube el último archivo tras un error. */
  retry: () => void;
  /** Limpia todo (p. ej. al cerrar el diálogo o tras guardar). */
  reset: () => void;
}

/**
 * Subida de UNA imagen a staging con preview, progreso, cancelación y retry.
 * Extrae el patrón que vivía inline en edit-event-dialog para reusarlo en los
 * flujos de creación (local/evento). La key resultante se envía en el submit
 * del formulario; el backend valida y promueve (no se confía en el cliente).
 */
export function useStagedUpload(scope: UploadScope): StagedUpload {
  const { data: session } = useSession();
  const token = session?.accessToken;

  const [stagedKey, setStagedKey] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<StagedUploadStatus>('idle');
  const fileRef = useRef<File | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  // Revoca el object-URL anterior al reemplazarlo y al desmontar.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const upload = useCallback(
    async (file: File) => {
      if (!token) {
        toast.error(SESSION_EXPIRED);
        return;
      }
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;
      setStatus('uploading');
      setProgress(0);
      setStagedKey(null);
      try {
        const key = await uploadToStaging(file, scope, token, setProgress, controller.signal);
        setStagedKey(key);
        setStatus('done');
      } catch (err) {
        // Cancelación deliberada: no es un error para el usuario.
        if (isAbortError(err)) return;
        setStatus('error');
        toast.error(getErrorMessage(err));
      }
    },
    [scope, token],
  );

  const accept = useCallback(
    (nextFile: File) => {
      fileRef.current = nextFile;
      setFile(nextFile);
      setPreviewUrl(URL.createObjectURL(nextFile));
      void upload(nextFile);
    },
    [upload],
  );

  const clear = useCallback(() => {
    controllerRef.current?.abort();
    fileRef.current = null;
    setFile(null);
    setPreviewUrl(null);
    setStagedKey(null);
    setProgress(0);
    setStatus('idle');
  }, []);

  const retry = useCallback(() => {
    if (fileRef.current) void upload(fileRef.current);
  }, [upload]);

  return { stagedKey, file, previewUrl, progress, status, accept, cancel: clear, retry, reset: clear };
}
