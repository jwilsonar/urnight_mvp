import { Bank, Plus } from '@phosphor-icons/react/dist/ssr';
import type { Metadata } from 'next';
import { Badge, Button, Card } from '@urnight/ui';
import { WALLET_DEMO } from '@/lib/mock/fidelizacion';

export const metadata: Metadata = {
  title: 'Wallet UrNight',
  description: 'Tu saldo, reembolsos y movimientos en un solo lugar.',
};

/** Pantalla 35 del prototipo. Demo frontend-only (sin backend de wallet). */
export default function WalletPage() {
  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-heading text-xl font-extrabold tracking-tight">Wallet UrNight</h2>
          <p className="text-sm text-muted-foreground">
            Tu saldo, reembolsos y movimientos en un solo lugar.
          </p>
        </div>
        <Badge variant="info">Demo — llega con el backend de wallet</Badge>
      </div>

      {/* Card de saldo con gradiente amatista del prototipo */}
      <div className="rounded-xl border border-accent-border bg-[linear-gradient(135deg,var(--accent-soft-strong),var(--accent-soft))] p-6 sm:p-7">
        <p className="un-eyebrow">Saldo disponible</p>
        <p className="mt-1 font-heading text-5xl font-black tracking-tight">{WALLET_DEMO.saldo}</p>
        <p className="mt-1 text-sm text-muted-foreground">{WALLET_DEMO.equivalencia}</p>
        <div className="mt-5 flex flex-wrap gap-2.5">
          <Button disabled>
            <Plus className="size-4" /> Recargar saldo
          </Button>
          <Button variant="secondary" disabled>
            <Bank className="size-4" weight="duotone" /> Retirar a banco
          </Button>
        </div>
      </div>

      <Card className="mt-5 overflow-hidden p-0">
        <div className="border-b px-5 py-3.5">
          <h3 className="text-[15px] font-bold">Movimientos recientes</h3>
        </div>
        {WALLET_DEMO.movimientos.map((m) => (
          <div
            key={`${m.fecha}-${m.concepto}`}
            className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 border-b px-5 py-3.5 text-sm last:border-b-0 sm:grid-cols-[130px_1fr_110px_100px]"
          >
            <span className="font-mono text-xs text-muted-foreground">{m.fecha}</span>
            <span className="col-span-2 sm:col-span-1">{m.concepto}</span>
            <span
              className={
                m.tipo === 'in'
                  ? 'text-right font-bold text-success'
                  : 'text-right font-bold text-destructive'
              }
            >
              {m.monto}
            </span>
            <span className="hidden text-right text-muted-foreground sm:block">{m.saldo}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}
