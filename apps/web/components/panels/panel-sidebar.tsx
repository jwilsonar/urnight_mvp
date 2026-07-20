'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@urnight/ui';
import { PANEL_NAV, SECTION_LABEL, type PanelSection } from './nav-config';

function isActive(pathname: string, href: string, exact?: boolean): boolean {
  return exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

/** Navegación lateral por sección. Usada en desktop (fija) y móvil (en Sheet). */
export function PanelSidebar({
  section,
  onNavigate,
  className,
}: {
  section: PanelSection;
  onNavigate?: () => void;
  className?: string;
}) {
  const pathname = usePathname();
  const items = PANEL_NAV[section];

  return (
    <nav
      className={cn('flex h-full min-h-0 flex-col gap-1 overflow-y-auto overscroll-contain pr-1', className)}
      aria-label="Navegación del panel"
    >
      <p className="rv-eyebrow px-3 pb-1">{SECTION_LABEL[section]}</p>
      {items.map((item) => {
        const Icon = item.icon;
        const active = isActive(pathname, item.href, item.exact);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'inline-flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              // Item activo DS: tinte carmín + texto rosa.
              active ? 'bg-accent text-rose' : 'text-muted-foreground hover:bg-white/5 hover:text-foreground',
            )}
          >
            <Icon className="h-4 w-4" weight={active ? 'fill' : 'regular'} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
