'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button, Input } from '@urnight/ui';
import { requestLocalVerification } from '@/lib/api/admin';
import { useApiMutation } from '@/lib/api/use-api-mutation';

/** Solicita la verificación del local (#15). POST /locals/:id/verifications. */
export function RequestVerificationButton({ localId }: { localId: string }) {
  const { data: session } = useSession();
  const token = session?.accessToken ?? '';
  const [license, setLicense] = useState('');

  const mutation = useApiMutation({
    mutationFn: () =>
      requestLocalVerification(localId, license ? { licenseReference: license } : {}, token),
    successMessage: 'Solicitud de verificación enviada.',
  });

  return (
    <div className="flex flex-wrap items-end gap-2">
      <Input
        value={license}
        onChange={(event) => setLicense(event.target.value)}
        placeholder="N° de licencia (opcional)"
        className="w-56"
        aria-label="Número de licencia"
      />
      <Button
        variant="outline"
        disabled={mutation.isPending}
        onClick={() => mutation.mutate(undefined)}
      >
        Solicitar verificación
      </Button>
    </div>
  );
}
