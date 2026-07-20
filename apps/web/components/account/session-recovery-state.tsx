'use client';

import { ArrowClockwise, Warning } from '@phosphor-icons/react';
import { Alert, AlertDescription, AlertTitle, Button } from '@urnight/ui';
import { handleSessionExpired } from '@/lib/auth/session-expiry';

export function SessionRecoveryState() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-12 text-center">
      <Alert variant="destructive" className="text-left">
        <Warning className="size-4" />
        <AlertTitle>Necesitamos renovar tu sesión</AlertTitle>
        <AlertDescription>Vuelve a iniciar sesión para cargar tus entradas sin perder esta ruta.</AlertDescription>
      </Alert>
      <Button type="button" onClick={handleSessionExpired}>
        <ArrowClockwise className="size-4" /> Volver a iniciar sesión
      </Button>
    </div>
  );
}
