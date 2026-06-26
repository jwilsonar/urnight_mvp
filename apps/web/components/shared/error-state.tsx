'use client';

import { Warning } from '@phosphor-icons/react';
import { Alert, AlertDescription, AlertTitle, Button } from '@urnight/ui';

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

/** Estado de error reutilizable para error boundaries (error.tsx). */
export function ErrorState({
  title = 'Algo salió mal',
  description = 'No pudimos cargar esta sección. Inténtalo de nuevo.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-16 text-center">
      <Alert variant="destructive" className="text-left">
        <Warning className="h-4 w-4" />
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription>{description}</AlertDescription>
      </Alert>
      {onRetry ? (
        <Button onClick={onRetry} variant="outline">
          Reintentar
        </Button>
      ) : null}
    </div>
  );
}
