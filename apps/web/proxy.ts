import { NextResponse, type NextRequest } from 'next/server';

/**
 * Gate de UX (edge-safe): redirige a /login si no hay cookie de sesión en rutas
 * privadas. La autorización real (rol/scope) la hacen los layouts server-side
 * con requireSession/requireRole, y el backend revalida cada request.
 * (Next 16 renombró `middleware` → `proxy`.)
 */
const SESSION_COOKIES = ['authjs.session-token', '__Secure-authjs.session-token'];

export default function proxy(req: NextRequest) {
  const hasSession = SESSION_COOKIES.some((name) => req.cookies.has(name));
  if (hasSession) return NextResponse.next();

  const url = new URL('/login', req.nextUrl);
  url.searchParams.set('callbackUrl', req.nextUrl.pathname + req.nextUrl.search);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/account/:path*', '/panel/:path*', '/checkout/:path*'],
};
