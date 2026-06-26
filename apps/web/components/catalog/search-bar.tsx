'use client';

import { MagnifyingGlass } from '@phosphor-icons/react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Input } from '@urnight/ui';

/**
 * Búsqueda por texto (#3) que sincroniza `q` con la query string.
 * - Sin `target`: busca en la página actual preservando filtros (zona, etc.).
 *   Reutilizable en /events y /locals.
 * - Con `target` (p. ej. barra global del header): navega a esa ruta con `q`
 *   limpio, sin arrastrar filtros de la página de origen.
 */
export function SearchBar({ placeholder, target }: { placeholder?: string; target?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [value, setValue] = useState(params.get('q') ?? '');

  function submit(event: FormEvent) {
    event.preventDefault();
    const base = target ?? pathname;
    const next = target ? new URLSearchParams() : new URLSearchParams(params);
    const trimmed = value.trim();
    if (trimmed) next.set('q', trimmed);
    else next.delete('q');
    router.push(`${base}${next.toString() ? `?${next.toString()}` : ''}`);
  }

  return (
    <form onSubmit={submit} className="relative w-full sm:w-72">
      <MagnifyingGlass
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <Input
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder ?? 'Buscar…'}
        className="pl-9"
        aria-label="Buscar"
      />
    </form>
  );
}
