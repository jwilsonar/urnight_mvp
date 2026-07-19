import { Tray } from '@phosphor-icons/react/dist/ssr';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  /** Compacto para popovers/dropdowns/columnas (menos padding, mark más chico). */
  compact?: boolean;
}

/**
 * Estado vacío reutilizable (patrón "empty state" con mark de icono + título +
 * descripción + acción). Estructura tomada de patrones 21st, revestida con los
 * tokens del DS (accent-border, rose, rv-*). Si no se pasa icono, usa uno
 * neutral por defecto para que nunca quede "a medio hacer".
 */
export function EmptyState({ icon, title, description, action, compact }: EmptyStateProps) {
  const mark = icon ?? <Tray weight="duotone" />;
  return (
    <div
      className={
        compact
          ? 'flex flex-col items-center justify-center gap-2 px-4 py-8 text-center'
          : 'flex flex-col items-center justify-center gap-3.5 rounded-lg border border-dashed px-6 py-16 text-center'
      }
    >
      {/* Mark de icono del DS: tinte carmín, borde suave, radio 20. */}
      <div
        className={
          compact
            ? 'flex size-11 items-center justify-center rounded-lg border border-accent-border bg-accent text-rose [&_svg]:size-5'
            : 'flex size-[72px] items-center justify-center rounded-xl border border-accent-border bg-accent text-rose [&_svg]:size-[30px]'
        }
      >
        {mark}
      </div>
      <h3 className={compact ? 'font-heading text-base font-bold' : 'font-heading text-xl font-extrabold'}>
        {title}
      </h3>
      {description ? (
        <p className="max-w-[420px] text-sm leading-relaxed text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
