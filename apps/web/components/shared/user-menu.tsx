'use client';

import { Envelope, Gauge, Heart, SignOut, Ticket, UserCircle } from '@phosphor-icons/react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
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
  Skeleton,
} from '@urnight/ui';
import { signOutAction } from '@/lib/auth-actions';
import { ROLE_PANEL_LABEL, canAccessPanels, primaryRole, roleHomePath } from '@/lib/utils/rbac';

function initials(name?: string | null): string {
  if (!name) return 'U';
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

/** Avatar + menú de cuenta cuando hay sesión; botones de acceso si no. */
export function UserMenu() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <Skeleton className="h-9 w-9 rounded-full" />;
  }

  if (!session?.user) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/login">Ingresar</Link>
        </Button>
        <Button size="sm" asChild>
          <Link href="/register">Crear cuenta</Link>
        </Button>
      </div>
    );
  }

  const user = session.user;
  const showPanel = canAccessPanels(user.roles);
  const panelHref = roleHomePath(user.roles);
  const panelLabel = ROLE_PANEL_LABEL[primaryRole(user.roles)];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full" aria-label="Menú de usuario">
          <Avatar className="h-9 w-9">
            {user.image ? <AvatarImage src={user.image} alt="" /> : null}
            <AvatarFallback>{initials(user.name)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col">
          <span className="truncate">{user.name}</span>
          <span className="truncate text-xs font-normal text-muted-foreground">{user.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {showPanel ? (
          <DropdownMenuItem asChild>
            <Link href={panelHref}>
              <Gauge className="h-4 w-4" /> {panelLabel}
            </Link>
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuItem asChild>
          <Link href="/account">
            <UserCircle className="h-4 w-4" /> Mi perfil
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/account/tickets">
            <Ticket className="h-4 w-4" /> Mis entradas
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/account/guardados">
            <Heart className="h-4 w-4" /> Guardados
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/account/invitaciones">
            <Envelope className="h-4 w-4" /> Invitaciones
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={(event) => {
            event.preventDefault();
            void signOutAction();
          }}
        >
          <SignOut className="h-4 w-4" /> Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
