'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@urnight/ui';

export const NAV_LINKS = [
  { href: '/', label: 'Inicio' },
  { href: '/events', label: 'Eventos' },
  { href: '/locals', label: 'Locales' },
  { href: '/categorias', label: 'Categorías' },
] as const;

/** Navegación principal del sitio público (desktop). */
export function MainNav({ className }: { className?: string }) {
  const pathname = usePathname();
  return (
    <nav className={cn('flex items-center gap-1', className)} aria-label="Navegación principal">
      {NAV_LINKS.map((link) => {
        const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'rounded-md px-3 py-2 text-sm font-medium transition-colors hover:text-foreground',
              active ? 'text-foreground' : 'text-muted-foreground',
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
