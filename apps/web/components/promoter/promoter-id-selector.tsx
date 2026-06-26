'use client';

import { MagnifyingGlass } from '@phosphor-icons/react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button, Input, Label } from '@urnight/ui';
import { isUuid } from '@/lib/utils';

interface PromoterIdSelectorProps {
  /** Se invoca con un UUID válido para usar como promotor activo. */
  onSelect: (promoterId: string) => void;
}

/**
 * Permite ingresar un `promoterId` conocido para gestionar sus códigos y ventas,
 * dado que el backend no expone `GET /promoters/me`.
 */
export function PromoterIdSelector({ onSelect }: PromoterIdSelectorProps) {
  const [value, setValue] = useState('');

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = value.trim();
    if (!isUuid(trimmed)) {
      toast.error('Ingresa un ID de promotor válido (UUID).');
      return;
    }
    onSelect(trimmed);
    toast.success('Promotor seleccionado.');
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="promoter-id">ID de promotor</Label>
        <div className="flex gap-2">
          <Input
            id="promoter-id"
            placeholder="00000000-0000-0000-0000-000000000000"
            className="font-mono"
            value={value}
            onChange={(event) => setValue(event.target.value)}
          />
          <Button type="submit" variant="outline">
            <MagnifyingGlass className="mr-2 h-4 w-4" />
            Usar
          </Button>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Pega el UUID de un promotor existente para gestionar sus códigos y ver sus comisiones.
      </p>
    </form>
  );
}
