import { Lock } from '@phosphor-icons/react/dist/ssr';
import type { ReactNode } from 'react';
import { Logo } from '@/components/shared/logo';

export default function CheckoutLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-muted/30">
      <header className="border-b bg-background">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <Lock className="h-4 w-4" /> Pago seguro
          </span>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
