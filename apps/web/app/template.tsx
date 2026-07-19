/**
 * Template raíz: App Router lo remonta en cada navegación, disparando el
 * fade-up corto de .rv-page-in (globals.css). Solo visual — nada de estado ni
 * providers aquí (se perderían al navegar). Con prefers-reduced-motion la
 * animación se desactiva por CSS.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="rv-page-in">{children}</div>;
}
