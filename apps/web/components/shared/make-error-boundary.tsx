'use client';

import { useEffect } from 'react';
import { logger } from '@/lib/logger';
import { ErrorState } from './error-state';

interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Fábrica de error boundaries (`error.tsx`). Centraliza el cuerpo idéntico
 * (`'use client'` + log + `ErrorState`) que antes se repetía en cada segmento;
 * cada `error.tsx` solo aporta su título.
 */
export function makeErrorBoundary(title?: string) {
  return function ErrorBoundary({ error, reset }: ErrorBoundaryProps) {
    useEffect(() => {
      logger.error(
        { title, digest: error.digest, err: error.message },
        'web.boundary.error',
      );
    }, [error]);

    return <ErrorState title={title} onRetry={reset} />;
  };
}
