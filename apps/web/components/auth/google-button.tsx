'use client';

import { GoogleLogo } from '@phosphor-icons/react';
import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { Button } from '@urnight/ui';

/** Inicia el flujo OIDC de Google. El id_token se canjea por el JWT del backend en el callback. */
export function GoogleButton({ callbackUrl = '/' }: { callbackUrl?: string }) {
  const [loading, setLoading] = useState(false);
  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      disabled={loading}
      onClick={() => {
        setLoading(true);
        // Auth.js v5 renombró `callbackUrl` → `redirectTo`.
        void signIn('google', { redirectTo: callbackUrl });
      }}
    >
      <GoogleLogo className="h-4 w-4" weight="bold" />
      Continuar con Google
    </Button>
  );
}
