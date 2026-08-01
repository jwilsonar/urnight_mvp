"use client";

import { UploadSimple } from "@phosphor-icons/react";
import { useDropzone, type Accept, type FileRejection } from "react-dropzone";
import { toast } from "sonner";
import { ACCEPTED_IMAGE_TYPES, MAX_IMAGE_BYTES } from "@urnight/contracts";
import { cn } from "@urnight/ui";

const ACCEPT: Accept = Object.fromEntries(
  ACCEPTED_IMAGE_TYPES.map((t) => [t, []]),
);
const MAX_MB = Math.round(MAX_IMAGE_BYTES / (1024 * 1024));

interface MediaDropzoneProps {
  /** Recibe los archivos que pasan validación de tipo/tamaño. */
  onAccepted: (files: File[]) => void;
  disabled?: boolean;
  /** Máximo de archivos por soltada (galería ilimitada por defecto). */
  maxFiles?: number;
}

/**
 * Zona drag-and-drop reusable. Valida tipo y tamaño con las constantes
 * compartidas (@urnight/contracts) antes de emitir los archivos aceptados.
 */
export function MediaDropzone({
  onAccepted,
  disabled,
  maxFiles,
}: MediaDropzoneProps) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: ACCEPT,
    maxSize: MAX_IMAGE_BYTES,
    maxFiles,
    disabled,
    onDrop: (accepted: File[], rejections: FileRejection[]) => {
      for (const rej of rejections) {
        const tooBig = rej.errors.some((e) => e.code === "file-too-large");
        toast.error(
          tooBig
            ? `"${rej.file.name}" supera ${MAX_MB} MB.`
            : `"${rej.file.name}" no es una imagen válida (JPG, PNG o WebP).`,
        );
      }
      if (accepted.length) onAccepted(accepted);
    },
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border px-6 py-8 text-center transition-colors",
        isDragActive &&
          "border-accent-border bg-[var(--accent-soft-faint)]",
        disabled && "pointer-events-none opacity-60",
      )}
    >
      <input {...getInputProps()} />
      <UploadSimple className="h-7 w-7 text-muted-foreground" />
      <p className="text-sm font-medium">
        {isDragActive
          ? "Suelta las imágenes aquí"
          : "Arrastra imágenes o haz clic para subir"}
      </p>
      <p className="text-xs text-muted-foreground">
        JPG, PNG o WebP · máx {MAX_MB} MB c/u
      </p>
    </div>
  );
}
