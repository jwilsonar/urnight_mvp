import type { ReactNode } from 'react';

/**
 * Encabezado estándar de página de panel: título + descripción opcional y, a la
 * derecha, acciones (botones, diálogos). Unifica el patrón repetido en las
 * páginas de admin/promotor/super admin (DRY).
 */
export function PanelPageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-bold">{title}</h1>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {children}
    </div>
  );
}
