import { ArrowUpRight, Eye } from '@phosphor-icons/react/dist/ssr';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Badge, Card } from '@urnight/ui';
import { Reveal } from '@/components/shared/reveal';

export const metadata: Metadata = {
  title: 'Pantallas del sistema',
  description: 'Índice visual de todas las pantallas para revisión y QA.',
  robots: { index: false, follow: false },
};

/**
 * ÍNDICE DE REVISIÓN (equivalente al "Ver todas las pantallas" del prototipo).
 * Herramienta interna para auditar visualmente el frontend completo: cada card
 * enlaza una pantalla y marca si es funcional (backend real) o demo (frontend).
 * En producción esta ruta se ocultará tras un flag.
 */

type Estado = 'real' | 'demo' | 'mixta';

interface Pantalla {
  ruta: string;
  nombre: string;
  estado: Estado;
  nota?: string;
}

interface Grupo {
  titulo: string;
  descripcion?: string;
  pantallas: Pantalla[];
}

const GRUPOS: Grupo[] = [
  {
    titulo: '1 · B2C — Descubrimiento',
    pantallas: [
      { ruta: '/', nombre: 'Home', estado: 'real', nota: 'Hero + secciones con datos del API' },
      { ruta: '/events', nombre: 'Listado de eventos', estado: 'real', nota: 'Chips de género + búsqueda' },
      { ruta: '/events/calendar', nombre: 'Calendario mensual', estado: 'real' },
      { ruta: '/events/tendencias', nombre: 'Tendencias', estado: 'real' },
      { ruta: '/locals', nombre: 'Listado de locales', estado: 'real', nota: 'Filtro por zona' },
      { ruta: '/categorias', nombre: 'Categorías', estado: 'real', nota: 'Zonas, géneros y etiquetas' },
      { ruta: '/search', nombre: 'Búsqueda global', estado: 'real' },
      { ruta: '/events', nombre: 'Detalle de evento', estado: 'real', nota: 'Entra a cualquier card del listado' },
      { ruta: '/locals', nombre: 'Detalle de local', estado: 'real', nota: 'Entra a cualquier card del listado' },
      {
        ruta: '/locals/nocturna-club',
        nombre: 'Crowd-meter del local',
        estado: 'demo',
        nota: 'Aforo en vivo dentro del detalle de local',
      },
    ],
  },
  {
    titulo: '2 · Autenticación y onboarding',
    pantallas: [
      { ruta: '/login', nombre: 'Iniciar sesión', estado: 'real', nota: 'Layout split del prototipo' },
      { ruta: '/register', nombre: 'Crear cuenta', estado: 'real' },
      { ruta: '/recover', nombre: 'Recuperar contraseña', estado: 'demo' },
      { ruta: '/verify-email', nombre: 'Verificar email', estado: 'demo' },
      { ruta: '/2fa', nombre: 'Verificación 2FA', estado: 'demo' },
      {
        ruta: '/onboarding',
        nombre: 'Onboarding de preferencias',
        estado: 'real',
        nota: 'Solo aparece con cuenta nueva (regístrate para verlo); si ya lo completaste, redirige',
      },
    ],
  },
  {
    titulo: '3 · Compra de entradas y reserva de mesa',
    pantallas: [
      {
        ruta: '/events',
        nombre: 'Checkout de entradas (T1–T4)',
        estado: 'real',
        nota: 'Entra a un evento → elige entradas → comprar (con sesión)',
      },
      { ruta: '/reserva', nombre: 'Reserva de mesa (R1–R5)', estado: 'demo', nota: 'Wizard: mesa → detalles → botellas → resumen → listo' },
      { ruta: '/locals/nocturna-club/carta', nombre: 'Carta del local (in-venue)', estado: 'demo', nota: 'Con entrada validada: carta → pedido demo → recojo en barra' },
      {
        ruta: '/locals/nocturna-club/carta',
        nombre: 'Split bill (dividir cuenta)',
        estado: 'demo',
        nota: 'Dentro del Sheet del pedido',
      },
      { ruta: '/canjear/ANDREA10', nombre: 'Canjear código promotor', estado: 'real', nota: 'Código del seed' },
      { ruta: '/p/ANDREA10', nombre: 'Landing pública de promotor', estado: 'real' },
    ],
  },
  {
    titulo: '4 · Mi cuenta (inicia sesión: user@ravenue.pe)',
    descripcion: 'La contraseña de prueba está en el seed del repo (packages/db).',
    pantallas: [
      { ruta: '/account', nombre: 'Perfil', estado: 'real' },
      { ruta: '/account/tickets', nombre: 'Mis entradas (QR)', estado: 'real' },
      { ruta: '/account/guardados', nombre: 'Guardados / favoritos', estado: 'real' },
      { ruta: '/account/reservas', nombre: 'Mis reservas (R6)', estado: 'demo' },
      { ruta: '/account/wallet', nombre: 'Wallet RAVENUE', estado: 'demo' },
      { ruta: '/account/niveles', nombre: 'Niveles y badges', estado: 'demo' },
      { ruta: '/account/puntos', nombre: 'Historial y canje de puntos', estado: 'demo' },
      { ruta: '/account/referidos', nombre: 'Programa de referidos', estado: 'demo' },
      { ruta: '/account/notificaciones', nombre: 'Notificaciones', estado: 'real' },
      { ruta: '/account/invitaciones', nombre: 'Invitaciones', estado: 'real' },
      { ruta: '/account/amigos', nombre: 'Amigos / perfil social', estado: 'demo' },
    ],
  },
  {
    titulo: '5 · Informativas, legales y estados',
    pantallas: [
      { ruta: '/nosotros', nombre: 'Sobre nosotros', estado: 'real' },
      { ruta: '/faq', nombre: 'Preguntas frecuentes', estado: 'real' },
      { ruta: '/ayuda', nombre: 'Centro de ayuda', estado: 'real' },
      { ruta: '/reclamaciones', nombre: 'Libro de Reclamaciones', estado: 'demo' },
      { ruta: '/legal/terms', nombre: 'Términos y condiciones', estado: 'real' },
      { ruta: '/legal/privacy', nombre: 'Políticas de privacidad', estado: 'real' },
      { ruta: '/legal/cookies', nombre: 'Políticas de cookies', estado: 'real' },
      { ruta: '/legal/beneficiario', nombre: 'Beneficiario Final', estado: 'real' },
      { ruta: '/legal/clausulas', nombre: 'Cláusulas adicionales', estado: 'real' },
      { ruta: '/afiliar', nombre: 'Afiliar mi local', estado: 'real' },
      { ruta: '/promotor/postular', nombre: 'Postular a promotor', estado: 'real' },
      { ruta: '/pagina-inexistente', nombre: 'Error 404', estado: 'real', nota: 'Pantalla de marca' },
    ],
  },
  {
    titulo: '6 · Paneles por rol',
    descripcion:
      'Cierra sesión y entra con el correo indicado (contraseña de prueba: en el seed del repo, packages/db).',
    pantallas: [
      { ruta: '/panel', nombre: 'Selector de paneles', estado: 'real', nota: 'Cualquier rol staff' },
      { ruta: '/panel/admin', nombre: 'Panel de local (admin)', estado: 'real', nota: 'owner.nocturna@ravenue.pe' },
      { ruta: '/panel/admin/locals', nombre: 'PL · Mis locales', estado: 'real' },
      {
        ruta: '/panel/admin/locals',
        nombre: 'PL · Wizard crear evento (4 pasos)',
        estado: 'mixta',
        nota: 'Entra a un local → Crear evento',
      },
      { ruta: '/panel/admin/promoters', nombre: 'PL · Promotores', estado: 'real' },
      { ruta: '/panel/admin/mesas', nombre: 'PL · Mesas y planta', estado: 'demo', nota: 'Plano del local + reservas del día' },
      { ruta: '/panel/admin/carta', nombre: 'PL · Carta del local', estado: 'demo', nota: 'Registro de productos, precios y disponibilidad' },
      { ruta: '/panel/admin/pedidos', nombre: 'PL · Pedidos in-venue', estado: 'demo', nota: 'Cola de pedidos de la carta por estado' },
      { ruta: '/panel/admin/checkin', nombre: 'PL · Check-in en vivo', estado: 'demo', nota: 'Aforo + validaciones de puerta' },
      { ruta: '/panel/superadmin', nombre: 'Super Admin', estado: 'real', nota: 'admin@ravenue.pe' },
      { ruta: '/panel/superadmin/companies', nombre: 'SA · Empresas', estado: 'real' },
      { ruta: '/panel/superadmin/affiliations', nombre: 'SA · Afiliaciones', estado: 'real' },
      { ruta: '/panel/superadmin/reviews', nombre: 'SA · Reseñas y reportes', estado: 'real' },
      { ruta: '/panel/superadmin/audit', nombre: 'SA · Auditoría', estado: 'real' },
      { ruta: '/panel/superadmin/fidelizacion', nombre: 'SA · Fidelización', estado: 'demo', nota: 'Config de niveles, puntos e insignias' },
      { ruta: '/panel/superadmin/reclamaciones', nombre: 'SA · Reclamaciones', estado: 'demo', nota: 'Bandeja del Libro de Reclamaciones' },
      { ruta: '/panel/superadmin/antifraude', nombre: 'SA · Antifraude', estado: 'demo', nota: 'Señales de reventa y abuso' },
      { ruta: '/panel/superadmin/salud', nombre: 'SA · Salud del producto', estado: 'demo', nota: 'Métricas y estado de servicios' },
      { ruta: '/panel/promoter', nombre: 'Panel RRPP (KPIs)', estado: 'real', nota: 'promoter@ravenue.pe' },
      { ruta: '/panel/promoter/links', nombre: 'RRPP · Mis links', estado: 'real' },
      { ruta: '/panel/promoter/ventas', nombre: 'RRPP · Ventas', estado: 'real' },
      { ruta: '/panel/promoter/liquidaciones', nombre: 'RRPP · Liquidaciones', estado: 'demo', nota: 'Comisiones por quincena' },
      { ruta: '/panel/validator', nombre: 'Panel validador', estado: 'real', nota: 'validator@ravenue.pe' },
    ],
  },
];

const ESTADO_BADGE: Record<Estado, { label: string; variant: 'success' | 'info' | 'warning' }> = {
  real: { label: 'Funcional', variant: 'success' },
  demo: { label: 'Demo', variant: 'info' },
  mixta: { label: 'Mixta', variant: 'warning' },
};

export default function PantallasPage() {
  const total = GRUPOS.reduce((sum, g) => sum + g.pantallas.length, 0);
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <Reveal>
        <p className="rv-eyebrow flex items-center gap-2">
          <Eye className="size-4" weight="duotone" /> Revisión interna
        </p>
        <h1 className="mt-2 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
          Pantallas del sistema
        </h1>
        <p className="mt-4 max-w-2xl leading-relaxed text-muted-foreground">
          {total} rutas navegables para auditar el frontend completo.{' '}
          <Badge variant="success">Funcional</Badge> = conectada al backend real;{' '}
          <Badge variant="info">Demo</Badge> = capa de frontend visible mientras no exista su
          backend. Esta página es interna: se ocultará en producción.
        </p>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Nota: el prototipo cuenta más de 100 “pantallas de diseño”, pero varias son pasos de un
          mismo flujo o modales. Aquí cada ruta agrupa lo suyo: el wizard de reserva (R1–R5) es una
          sola ruta con sus 5 pasos, el checkout (T1–T4) vive dentro del evento, los modales
          (compartir, galería, reportar) están dentro de sus páginas, y el home cambia solo entre
          invitado y logueado.
        </p>
      </Reveal>

      {GRUPOS.map((grupo) => (
        <section key={grupo.titulo} className="mt-12">
          <Reveal>
            <h2 className="font-heading text-xl font-extrabold tracking-tight">{grupo.titulo}</h2>
            {grupo.descripcion ? (
              <p className="mt-1 text-sm text-muted-foreground">{grupo.descripcion}</p>
            ) : null}
          </Reveal>
          <div className="mt-5 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            {grupo.pantallas.map((p, i) => (
              <Reveal key={`${grupo.titulo}-${p.nombre}`} delay={(i % 3) * 60}>
                <Link href={p.ruta} className="block h-full">
                  <Card className="flex h-full flex-col p-4 transition-[border-color,transform,box-shadow] hover:-translate-y-0.5 hover:border-accent-border hover:shadow-float">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-heading text-[15px] font-bold leading-tight">{p.nombre}</p>
                      <ArrowUpRight className="size-4 shrink-0 text-rose" />
                    </div>
                    <p className="mt-1 font-mono text-xs text-muted-foreground">{p.ruta}</p>
                    {p.nota ? (
                      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{p.nota}</p>
                    ) : null}
                    <div className="mt-auto pt-3">
                      <Badge variant={ESTADO_BADGE[p.estado].variant}>
                        {ESTADO_BADGE[p.estado].label}
                      </Badge>
                    </div>
                  </Card>
                </Link>
              </Reveal>
            ))}
          </div>
        </section>
      ))}

      <Reveal>
        <p className="mt-12 rounded-md border border-info-border bg-info-soft px-4 py-3 text-sm leading-relaxed text-info">
          Storybook (componentes del design system): corre{' '}
          <code className="font-mono">pnpm --filter @urnight/web storybook</code> y abre
          localhost:6006.
        </p>
      </Reveal>
    </div>
  );
}
