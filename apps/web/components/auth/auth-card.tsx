import type { ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@urnight/ui';
import { Logo } from '@/components/shared/logo';

interface AuthCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}

/** Tarjeta centrada para las pantallas de autenticación. */
export function AuthCard({ title, description, children, footer }: AuthCardProps) {
  return (
    // Card de auth DS: radio 20, sombra profunda flotando sobre el glow.
    <Card className="w-full max-w-md rounded-xl shadow-overlay">
      <CardHeader className="space-y-2 text-center">
        <Logo className="mx-auto text-2xl" />
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
      {footer ? <div className="px-6 pb-6 text-center text-sm text-muted-foreground">{footer}</div> : null}
    </Card>
  );
}
