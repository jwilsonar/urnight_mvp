'use client';

import { ArrowSquareOut, Gauge, GearSix, SignOut } from '@phosphor-icons/react';
import { useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@urnight/ui';
import { LocaleSwitcher } from '@/components/shared/locale-switcher';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { clearCacheAndSignOut } from '@/lib/auth/client-sign-out';
import { ROLE_PANEL_LABEL, primaryRole, roleHomePath } from '@/lib/utils/rbac';

function initials(name?: string | null): string {
  if (!name) return 'U';
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

interface ProfileMenuUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  roles?: readonly string[];
}

/** Avatar + menú de cuenta del panel (ir al panel, ajustes, ver sitio, salir). */
export function ProfileMenu({ user }: { user: ProfileMenuUser }) {
  const queryClient = useQueryClient();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const panelHref = roleHomePath(user.roles);
  const panelLabel = ROLE_PANEL_LABEL[primaryRole(user.roles)];

  async function handleSignOut() {
    if (isSigningOut) return;
    setIsSigningOut(true);
    try {
      await clearCacheAndSignOut(queryClient);
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full" aria-label="Menú de cuenta">
          <Avatar className="h-9 w-9">
            {user.image ? <AvatarImage src={user.image} alt="" /> : null}
            <AvatarFallback>{initials(user.name)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="flex flex-col">
          <span className="truncate">{user.name}</span>
          <span className="truncate text-xs font-normal text-muted-foreground">{user.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="space-y-2 px-2 py-1 md:hidden">
          <ThemeToggle showLabel />
          <LocaleSwitcher id="panel-profile-language" showLabel />
        </div>
        <DropdownMenuSeparator className="md:hidden" />
        <DropdownMenuItem asChild>
          <Link href={panelHref}>
            <Gauge className="h-4 w-4" /> {panelLabel}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/account">
            <GearSix className="h-4 w-4" /> Ajustes de cuenta
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/">
            <ArrowSquareOut className="h-4 w-4" /> Ver sitio
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={isSigningOut}
          onSelect={(event) => {
            event.preventDefault();
            void handleSignOut();
          }}
        >
          <SignOut className="h-4 w-4" /> {isSigningOut ? 'Cerrando…' : 'Cerrar sesión'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
