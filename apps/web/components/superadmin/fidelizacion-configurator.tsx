'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@urnight/ui';
import { FidelizacionBadgesEditor } from './fidelizacion-badges-editor';
import { FidelizacionRulesEditor } from './fidelizacion-rules-editor';

export function FidelizacionConfigurator() {
  return (
    <Tabs defaultValue="badges" className="space-y-4">
      <TabsList aria-label="Secciones de configuración de fidelización">
        <TabsTrigger value="badges">Insignias</TabsTrigger>
        <TabsTrigger value="rules">Reglas de negocio</TabsTrigger>
      </TabsList>
      <TabsContent value="badges">
        <FidelizacionBadgesEditor />
      </TabsContent>
      <TabsContent value="rules">
        <FidelizacionRulesEditor />
      </TabsContent>
    </Tabs>
  );
}
