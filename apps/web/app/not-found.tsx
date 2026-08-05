import { MagnifyingGlass } from '@phosphor-icons/react/dist/ssr';
import Link from 'next/link';
import { Button } from '@urnight/ui';

/** Pantalla 49 del prototipo: 404 nocturno con glow de marca. */
export default function NotFound() {
  return (
    <div className="rv-hero-glow flex min-h-dvh flex-col items-center justify-center gap-5 px-4 text-center">
      <p className="font-display text-[110px] font-black leading-none tracking-tight text-rose [text-shadow:var(--glow-text)] sm:text-[150px]">
        404
      </p>
      <h1 className="font-heading text-2xl font-extrabold tracking-tight sm:text-3xl">
        Esta página se fue de after
      </h1>
      <p className="max-w-md leading-relaxed text-muted-foreground">
        La página que buscas no existe o fue movida. Pero la noche sigue — encuentra tu próximo
        plan.
      </p>
      <div className="mt-2 flex flex-wrap justify-center gap-3">
        <Button size="lg" asChild>
          <Link href="/">Volver al inicio</Link>
        </Button>
        <Button size="lg" variant="outline" asChild>
          <Link href="/events">
            <MagnifyingGlass className="size-4" weight="duotone" /> Explorar eventos
          </Link>
        </Button>
      </div>
    </div>
  );
}
