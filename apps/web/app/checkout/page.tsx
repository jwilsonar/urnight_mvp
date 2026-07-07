import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { CheckoutClient } from '@/components/checkout/checkout-client';
import type { ResolveRedemptionCodeResponse, TicketTypeListResponse } from '@urnight/contracts';
import { Alert, AlertDescription } from '@urnight/ui';
import { ApiError } from '@/lib/api/client';
import { getEventBySlug, getEventTicketTypes } from '@/lib/api/catalog';
import { resolveRedemptionCode } from '@/lib/api/promoters';
import { requireAccessToken } from '@/lib/auth-helpers';
import { formatDate } from '@/lib/utils';

export const metadata: Metadata = { title: 'Checkout' };

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ event?: string; code?: string }>;
}) {
  const { event: slug, code } = await searchParams;
  if (!slug) redirect('/events');

  const checkoutPath = `/checkout?event=${slug}${code ? `&code=${encodeURIComponent(code)}` : ''}`;
  // requireAccessToken (no requireSession): con la sesión expirada re-autenticamos en
  // vez de dejar llenar el formulario para que el POST falle con 401.
  const { session } = await requireAccessToken(checkoutPath);
  // Onboarding pendiente: completarlo antes de comprar.
  if (session.user.onboardingCompleted === false) {
    redirect(`/onboarding?callbackUrl=${encodeURIComponent(checkoutPath)}`);
  }

  let event;
  try {
    event = await getEventBySlug(slug);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  if (event.status !== 'published') {
    return (
      <Alert>
        <AlertDescription>Este evento no tiene entradas a la venta en este momento.</AlertDescription>
      </Alert>
    );
  }

  let ticketTypes: TicketTypeListResponse;
  try {
    ticketTypes = await getEventTicketTypes(event.id);
  } catch {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          No pudimos cargar las entradas en este momento. Inténtalo de nuevo en unos minutos.
        </AlertDescription>
      </Alert>
    );
  }

  // Código de promotor en la URL (/p/<code> → checkout?code=…): resuelve la oferta.
  // Si el código no resuelve o ya no es válido, `codeFailed` avisa (M12): NO caemos
  // al checkout de pago en silencio como si nunca hubiera habido una entrada gratis.
  let freeOffer: ResolveRedemptionCodeResponse | null = null;
  let codeFailed = false;
  if (code) {
    try {
      freeOffer = await resolveRedemptionCode(code);
      if (!freeOffer.valid) codeFailed = true;
    } catch {
      freeOffer = null;
      codeFailed = true;
    }
  }

  const showHeader = !(freeOffer?.valid && freeOffer.isFree);

  return (
    <div className="space-y-6">
      {codeFailed ? (
        <Alert>
          <AlertDescription>
            El código de promotor no es válido o expiró, así que la entrada gratis no se aplicó.
            Puedes continuar con la compra normal.
          </AlertDescription>
        </Alert>
      ) : null}
      {showHeader ? (
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">{event.name}</h1>
          <p className="text-sm text-muted-foreground">{formatDate(event.startsAt)}</p>
        </div>
      ) : null}
      <CheckoutClient
        event={event}
        ticketTypes={ticketTypes}
        presetCode={code}
        freeOffer={freeOffer}
      />
    </div>
  );
}
