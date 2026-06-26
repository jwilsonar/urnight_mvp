import Link from 'next/link';
import { Button } from '@urnight/ui';

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="font-heading text-5xl font-bold text-primary">404</p>
      <h1 className="text-xl font-semibold">Página no encontrada</h1>
      <p className="max-w-md text-muted-foreground">La página que buscas no existe o fue movida.</p>
      <Button asChild>
        <Link href="/">Volver al inicio</Link>
      </Button>
    </div>
  );
}
