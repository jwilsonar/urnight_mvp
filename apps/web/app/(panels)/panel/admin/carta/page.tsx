import type { Metadata } from 'next';
import { Badge } from '@urnight/ui';
import { CartaManager } from '@/components/admin/carta-manager';

export const metadata: Metadata = {
  title: 'Carta del local',
  description: 'Gestión de la carta in-venue: productos, categorías y disponibilidad.',
};

/*
 * Demo frontend-only (carta in-venue). Cuando exista el backend, esta pantalla
 * se conecta al módulo de catálogo in-venue: los datos mock de lib/mock/carta.ts
 * se reemplazan por fetchers en lib/api/ + schemas en @urnight/contracts, y la
 * configuración por local se persiste vía API.
 */

export default function AdminCartaPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">Carta del local</h1>
          <p className="text-muted-foreground">
            Registra los productos de tu carta, sus precios y su disponibilidad de esta noche.
          </p>
        </div>
        <Badge variant="info">Demo — llega con el backend</Badge>
      </div>
      <CartaManager />
    </div>
  );
}
