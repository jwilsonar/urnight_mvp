'use client';

import { ArrowClockwise } from '@phosphor-icons/react';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { Button } from '@urnight/ui';

export function PromoterRefreshButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      disabled={isPending}
      onClick={() => startTransition(() => router.refresh())}
    >
      <ArrowClockwise className="size-4" weight="duotone" />
      Actualizar
    </Button>
  );
}
