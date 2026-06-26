'use client';

import { useEffect } from 'react';
import { Button } from '@urnight/ui';
import { logger } from '@/lib/logger';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    logger.error({ digest: error.digest, err: error.message }, 'web.boundary.global_error');
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="font-heading text-2xl font-bold">Algo salió mal</h1>
      <p className="max-w-md text-muted-foreground">Ocurrió un error inesperado. Inténtalo de nuevo.</p>
      <Button onClick={reset}>Reintentar</Button>
    </div>
  );
}
