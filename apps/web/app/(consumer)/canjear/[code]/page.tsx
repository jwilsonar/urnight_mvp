import { Gift, XCircle } from '@phosphor-icons/react/dist/ssr';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@urnight/ui';
import { EmptyState } from '@/components/shared/empty-state';
import { registerRedemptionClick, resolveRedemptionCode } from '@/lib/api/promoters';
import { formatDate, formatPEN } from '@/lib/utils';

export const metadata: Metadata = { title: 'Canjear código' };

/** Describe el beneficio del código en una línea. */
function benefitLabel(d: Awaited<ReturnType<typeof resolveRedemptionCode>>): string {
  if (d.isFree) return 'Entrada gratis';
  if (d.discountType === 'percentage' && d.discountValue != null) return `${d.discountValue}% de descuento`;
  if (d.discountType === 'fixed_amount' && d.discountValue != null) return `${formatPEN(d.discountValue)} de descuento`;
  return 'Beneficio especial';
}

/**
 * Aterrizaje público de un código de canje de promotor (#13). Resuelve el código
 * y, si es válido, muestra el beneficio y enlaza al evento para completarlo.
 */
export default async function CanjearPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;

  const data = await resolveRedemptionCode(code).catch(() => null);
  // Atribución del promotor (best-effort, no bloquea la vista).
  void registerRedemptionClick(code).catch(() => {});

  if (!data || !data.valid) {
    return (
      <div className="mx-auto max-w-xl px-4 py-12 sm:px-6 lg:px-8">
        <EmptyState
          icon={<XCircle className="h-10 w-10" weight="duotone" />}
          title="Código no válido"
          description={data?.reason ?? 'Este código no existe, expiró o ya fue usado.'}
          action={
            <Button asChild>
              <Link href="/events">Explorar eventos</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-12 sm:px-6 lg:px-8">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Gift className="h-6 w-6" weight="duotone" />
          </div>
          <CardTitle className="font-heading text-2xl">{benefitLabel(data)}</CardTitle>
          <CardDescription>
            {data.promoterName ? `Cortesía de ${data.promoterName}` : 'Código de promotor'} · código{' '}
            <span className="font-mono">{data.code}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.event ? (
            <div className="space-y-1 rounded-lg border p-4">
              <p className="font-medium">{data.event.name}</p>
              <p className="text-sm text-muted-foreground">{formatDate(data.event.startsAt)}</p>
              {data.ticketType ? (
                <Badge variant="secondary" className="mt-1">
                  {data.ticketType.name} · {formatPEN(data.ticketType.price)}
                </Badge>
              ) : null}
            </div>
          ) : null}

          {data.savings > 0 ? (
            <p className="text-center text-sm text-muted-foreground">
              Ahorras <span className="font-semibold text-foreground">{formatPEN(data.savings)}</span>
            </p>
          ) : null}

          {data.event ? (
            <Button asChild className="w-full">
              <Link href={`/events/${data.event.slug}`}>Ver evento y continuar</Link>
            </Button>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
