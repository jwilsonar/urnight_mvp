import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { CheckoutClient } from '@/components/checkout/checkout-client';
import type { ResolveRedemptionCodeResponse, TicketTypeListResponse } from '@urnight/contracts';
import { Alert, AlertDescription } from '@urnight/ui';
import { ApiError } from '@/lib/api/client';
import { getEventBySlug, getEventTicketTypes } from '@/lib/api/catalog';
import { resolveRedemptionCode } from '@/lib/api/promoters';
import { requireSession } from '@/lib/auth-helpers';
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
  const session = await requireSession(checkoutPath);
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
  let freeOffer: ResolveRedemptionCodeResponse | null = null;
  if (code) {
    try {
      freeOffer = await resolveRedemptionCode(code);
    } catch {
      freeOffer = null;
    }
  }

  const showHeader = !(freeOffer?.valid && freeOffer.isFree);

  return (
    <div className="space-y-6">
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
