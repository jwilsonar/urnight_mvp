'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@urnight/ui';

const LINKS = [
  { href: '/account', label: 'Perfil' },
  { href: '/account/tickets', label: 'Mis entradas' },
  { href: '/account/guardados', label: 'Guardados' },
  { href: '/account/wallet', label: 'Wallet' },
  { href: '/account/niveles', label: 'Niveles' },
  { href: '/account/referidos', label: 'Referidos' },
  { href: '/account/notificaciones', label: 'Notificaciones' },
  { href: '/account/invitaciones', label: 'Invitaciones' },
] as const;

export function AccountNav() {
  const pathname = usePathname();
  return (
    <nav
      className="flex gap-1 overflow-x-auto border-b [scrollbar-width:none]"
      aria-label="Navegación de cuenta"
    >
      {LINKS.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              '-mb-px shrink-0 whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition-colors',
              active ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
