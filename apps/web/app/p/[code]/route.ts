import { NextResponse, type NextRequest } from 'next/server';
import { registerRedemptionClick, resolveRedemptionCode } from '@/lib/api/promoters';

/**
 * Enlace corto de compartir de un código de promotor. Resuelve el código,
 * registra el clic y redirige al checkout con la entrada gratis ya aplicada.
 * Si el código no es válido, lleva al catálogo de eventos.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;

  try {
    const resolved = await resolveRedemptionCode(code);
    // Registro de clic best-effort: no debe bloquear el redirect.
    void registerRedemptionClick(code).catch(() => {});

    if (resolved.valid && resolved.event) {
      const target = `/checkout?event=${resolved.event.slug}&code=${encodeURIComponent(resolved.code)}`;
      return NextResponse.redirect(new URL(target, request.url));
    }
  } catch {
    // Código inexistente o API caída → cae al catálogo.
  }

  return NextResponse.redirect(new URL('/events', request.url));
}
