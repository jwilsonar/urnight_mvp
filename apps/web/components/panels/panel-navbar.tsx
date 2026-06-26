'use client';

import { List } from '@phosphor-icons/react';
import { Button } from '@urnight/ui';
import { Logo } from '@/components/shared/logo';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { roleHomePath } from '@/lib/utils/rbac';
import { NotificationBell } from './notification-bell';
import { ProfileMenu } from './profile-menu';

interface PanelNavbarUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  roles?: readonly string[];
}

/** Barra superior del panel: logo + notificaciones + tema + menú de perfil. */
export function PanelNavbar({
  user,
  showMenu,
  onMenuClick,
}: {
  user: PanelNavbarUser;
  showMenu?: boolean;
  onMenuClick?: () => void;
}) {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
        {showMenu ? (
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label="Abrir menú"
            onClick={onMenuClick}
          >
            <List className="h-5 w-5" />
          </Button>
        ) : null}
        <Logo href={roleHomePath(user.roles)} />
        <div className="ml-auto flex items-center gap-1">
          <NotificationBell />
          <ThemeToggle />
          <ProfileMenu user={user} />
        </div>
      </div>
    </header>
  );
}
