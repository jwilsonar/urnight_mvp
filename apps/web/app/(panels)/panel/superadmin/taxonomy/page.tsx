import type { Metadata } from 'next';
import { TaxonomyManager } from '@/components/superadmin/taxonomy-manager';

export const metadata: Metadata = { title: 'Taxonomía' };

export default function TaxonomyPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h1 className="font-heading text-2xl font-bold">Taxonomía</h1>
        <p className="text-sm text-muted-foreground">Zonas, géneros musicales y etiquetas de la plataforma (#6/7/8).</p>
      </header>
      <TaxonomyManager title="Zonas" kind="zones" />
      <TaxonomyManager title="Géneros musicales" kind="musicGenres" />
      <TaxonomyManager title="Etiquetas" kind="tags" />
    </div>
  );
}
