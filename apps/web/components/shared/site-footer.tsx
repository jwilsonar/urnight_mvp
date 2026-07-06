import {
  FacebookLogo,
  InstagramLogo,
  TiktokLogo,
  XLogo,
  YoutubeLogo,
} from '@phosphor-icons/react/dist/ssr';
import Link from 'next/link';
import { Button } from '@urnight/ui';
import { ClearCookiesButton } from './clear-cookies-button';
import { Logo } from './logo';

const CONOCENOS = [
  { href: '/nosotros', label: 'Sobre nosotros' },
  { href: '/faq', label: 'Preguntas frecuentes' },
  { href: '/afiliar', label: 'Afiliar mi local' },
] as const;

const LEGALES = [
  { href: '/legal/terms', label: 'Términos y condiciones' },
  { href: '/legal/privacy', label: 'Políticas de privacidad' },
  { href: '/legal/cookies', label: 'Políticas de cookies' },
  { href: '/legal/beneficiario', label: 'Declaración del Beneficiario Final' },
  { href: '/legal/clausulas', label: 'Cláusulas de usos adicionales' },
] as const;

/* Redes aún sin perfiles publicados: iconos visibles pero sin navegación. */
const REDES = [
  { icon: FacebookLogo, label: 'Facebook' },
  { icon: InstagramLogo, label: 'Instagram' },
  { icon: XLogo, label: 'X' },
  { icon: TiktokLogo, label: 'TikTok' },
  { icon: YoutubeLogo, label: 'YouTube' },
] as const;

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: readonly { href: string; label: string }[];
}) {
  return (
    <div>
      <p className="un-eyebrow mb-4">{title}</p>
      <ul className="space-y-2.5">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Pie del sitio público — estructura del prototipo (Conócenos / Legales / Síguenos / Ayuda). */
export function SiteFooter() {
  return (
    <footer className="border-t bg-deep">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.2fr_1fr_1fr_1fr] lg:px-8">
        {/* Marca + tagline + idioma */}
        <div className="space-y-4">
          <Logo />
          <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
            La forma más fácil de descubrir la mejor noche de Lima. Eventos, bares y discotecas en
            un solo lugar.
          </p>
          <span className="inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold text-muted-foreground">
            🇵🇪 Español · Perú
          </span>
        </div>

        <FooterColumn title="Conócenos" links={CONOCENOS} />
        <FooterColumn title="Legales" links={LEGALES} />

        {/* Síguenos + Ayuda */}
        <div className="space-y-6">
          <div>
            <p className="un-eyebrow mb-4">Síguenos</p>
            <div className="flex flex-wrap gap-2">
              {REDES.map(({ icon: Icon, label }) => (
                <span
                  key={label}
                  title={`${label} — próximamente`}
                  aria-label={`${label} (próximamente)`}
                  className="flex size-10 cursor-default items-center justify-center rounded-sm border bg-white/[0.03] text-muted-foreground transition-colors hover:border-accent-border hover:text-foreground"
                >
                  <Icon className="size-4.5" weight="fill" />
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="un-eyebrow mb-4">Ayuda</p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" asChild>
                <a href="mailto:hola@urnight.pe">Contáctanos</a>
              </Button>
              <ClearCookiesButton />
            </div>
          </div>
        </div>
      </div>

      {/* Barra inferior: Libro de Reclamaciones + copyright */}
      <div className="border-t">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-5 sm:px-6 md:flex-row lg:px-8">
          <Link
            href="/reclamaciones"
            className="inline-flex items-center gap-2 rounded-sm bg-white px-4 py-2 text-sm font-bold text-neutral-900 transition-opacity hover:opacity-90"
          >
            📖 Libro de Reclamaciones
          </Link>
          <p className="text-xs text-muted-foreground">
            Copyright © UrNight {new Date().getFullYear()} · Todos los derechos reservados. Solo
            para mayores de 18 años.
          </p>
        </div>
      </div>
    </footer>
  );
}
