import {
  Armchair,
  Bell,
  BookOpenText,
  Buildings,
  ChartLineUp,
  ClockCounterClockwise,
  Gear,
  Handshake,
  House,
  Lifebuoy,
  LinkSimple,
  Medal,
  Megaphone,
  Money,
  type Icon,
  Pulse,
  QrCode,
  Receipt,
  Scroll,
  SealCheck,
  ShieldWarning,
  Tag,
  Ticket,
  UserCircle,
  WarningOctagon,
} from '@phosphor-icons/react';

/** Secciones de panel = primer segmento bajo /panel. */
export type PanelSection = 'admin' | 'promoter' | 'superadmin' | 'validator';

export interface PanelNavItem {
  href: string;
  label: string;
  icon: Icon;
  /** Activo solo en coincidencia exacta (para el "Inicio" de cada sección). */
  exact?: boolean;
}

export const SECTION_LABEL: Record<PanelSection, string> = {
  admin: 'Administración local',
  promoter: 'Promotor',
  superadmin: 'Plataforma',
  validator: 'Validador',
};

/** Links del sidebar por sección. */
export const PANEL_NAV: Record<PanelSection, PanelNavItem[]> = {
  admin: [
    { href: '/panel/admin', label: 'Dashboard', icon: House, exact: true },
    { href: '/panel/admin/locals', label: 'Locales', icon: Buildings },
    { href: '/panel/admin/promoters', label: 'Promotores', icon: Megaphone },
    { href: '/panel/admin/mesas', label: 'Mesas y planta', icon: Armchair },
    { href: '/panel/admin/carta', label: 'Carta del local', icon: BookOpenText },
    { href: '/panel/admin/pedidos', label: 'Pedidos', icon: Receipt },
    { href: '/panel/admin/checkin', label: 'Check-in en vivo', icon: QrCode },
  ],
  promoter: [
    { href: '/panel/promoter', label: 'Resumen', icon: ChartLineUp, exact: true },
    { href: '/panel/promoter/links', label: 'Mis links', icon: LinkSimple },
    { href: '/panel/promoter/ventas', label: 'Ventas', icon: Ticket },
    { href: '/panel/promoter/liquidaciones', label: 'Liquidaciones', icon: Money },
    { href: '/panel/promoter/perfil', label: 'Perfil', icon: UserCircle },
  ],
  superadmin: [
    { href: '/panel/superadmin', label: 'Inicio', icon: House, exact: true },
    { href: '/panel/superadmin/settings', label: 'Configuración', icon: Gear },
    { href: '/panel/superadmin/support', label: 'Soporte', icon: Lifebuoy },
    { href: '/panel/superadmin/legal', label: 'Legal', icon: Scroll },
    { href: '/panel/superadmin/notifications', label: 'Notificaciones', icon: Bell },
    { href: '/panel/superadmin/reviews', label: 'Revisiones', icon: SealCheck },
    { href: '/panel/superadmin/affiliations', label: 'Afiliaciones', icon: Handshake },
    { href: '/panel/superadmin/companies', label: 'Empresas', icon: Buildings },
    { href: '/panel/superadmin/audit', label: 'Auditoría', icon: ClockCounterClockwise },
    { href: '/panel/superadmin/taxonomy', label: 'Taxonomía', icon: Tag },
    { href: '/panel/superadmin/fidelizacion', label: 'Fidelización', icon: Medal },
    { href: '/panel/superadmin/reclamaciones', label: 'Reclamaciones', icon: WarningOctagon },
    { href: '/panel/superadmin/antifraude', label: 'Antifraude', icon: ShieldWarning },
    { href: '/panel/superadmin/salud', label: 'Salud del producto', icon: Pulse },
  ],
  validator: [{ href: '/panel/validator', label: 'Inicio', icon: QrCode, exact: true }],
};

/** Deriva la sección desde el pathname; null en el selector raíz `/panel`. */
export function sectionFromPath(pathname: string): PanelSection | null {
  const match = /^\/panel\/(admin|promoter|superadmin|validator)(?:\/|$)/.exec(pathname);
  return (match?.[1] as PanelSection | undefined) ?? null;
}
