import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

/** Estado vacío reutilizable para listados sin resultados. */
export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3.5 rounded-lg border border-dashed px-6 py-16 text-center">
      {/* Mark de icono del DS: tinte amatista, borde suave, radio 20. */}
      {icon ? (
        <div className="flex size-[72px] items-center justify-center rounded-xl border border-accent-border bg-accent text-lavender [&_svg]:size-[30px]">
          {icon}
        </div>
      ) : null}
      <h3 className="font-heading text-xl font-extrabold">{title}</h3>
      {description ? (
        <p className="max-w-[420px] text-sm leading-relaxed text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
