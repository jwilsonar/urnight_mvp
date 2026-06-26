import Link from 'next/link';
import { Logo } from './logo';

/** Pie del sitio público. */
export function SiteFooter() {
  return (
    <footer className="border-t bg-background">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
        <div className="space-y-1">
          <Logo />
          <p className="text-sm text-muted-foreground">Vida nocturna en Perú — locales, eventos y entradas.</p>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground" aria-label="Enlaces del pie">
          <Link href="/events" className="hover:text-foreground">Eventos</Link>
          <Link href="/locals" className="hover:text-foreground">Locales</Link>
          <Link href="/categorias" className="hover:text-foreground">Categorías</Link>
          <Link href="/afiliar" className="hover:text-foreground">Afilia tu local</Link>
          <Link href="/promotor/postular" className="hover:text-foreground">Sé promotor</Link>
          <Link href="/legal/terms" className="hover:text-foreground">Términos</Link>
          <Link href="/legal/privacy" className="hover:text-foreground">Privacidad</Link>
        </nav>
      </div>
      <div className="border-t py-4">
        <p className="text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} UrNight. Solo para mayores de 18 años.
        </p>
      </div>
    </footer>
  );
}
