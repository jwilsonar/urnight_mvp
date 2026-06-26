import type { Metadata } from 'next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@urnight/ui';
import { FavoritesList } from '@/components/account/favorites-list';

export const metadata: Metadata = { title: 'Guardados' };

/**
 * Guardados del usuario, separados por tipo (eventos / locales) con pestañas.
 * Reutiliza FavoritesList con su nuevo prop `filter`.
 */
export default function SavedPage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-heading text-lg font-semibold">Guardados</h2>
        <p className="text-sm text-muted-foreground">Eventos y locales que marcaste como favoritos.</p>
      </div>

      <Tabs defaultValue="events">
        <TabsList>
          <TabsTrigger value="events">Eventos</TabsTrigger>
          <TabsTrigger value="locals">Locales</TabsTrigger>
        </TabsList>
        <TabsContent value="events" className="pt-4">
          <FavoritesList filter="event" />
        </TabsContent>
        <TabsContent value="locals" className="pt-4">
          <FavoritesList filter="local" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
