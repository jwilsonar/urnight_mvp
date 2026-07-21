import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { CheckoutClient } from "@/components/checkout/checkout-client";
import type {
  ResolveRedemptionCodeResponse,
  TicketTypeListResponse,
} from "@urnight/contracts";
import { Alert, AlertDescription } from "@urnight/ui";
import { ApiError } from "@/lib/api/client";
import { getEventBySlug, getEventTicketTypes } from "@/lib/api/catalog";
import { resolveRedemptionCode } from "@/lib/api/promoters";
import { requireAccessToken } from "@/lib/auth-helpers";
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("checkout");
  return { title: t("title") };
}

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ event?: string; code?: string }>;
}) {
  const [t, format] = await Promise.all([
    getTranslations("checkout"),
    getFormatter(),
  ]);
  const { event: slug, code } = await searchParams;
  if (!slug) redirect("/events");

  const checkoutPath = `/checkout?event=${slug}${code ? `&code=${encodeURIComponent(code)}` : ""}`;
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

  if (event.status !== "published") {
    return (
      <Alert>
        <AlertDescription>{t("eventUnavailable")}</AlertDescription>
      </Alert>
    );
  }

  let ticketTypes: TicketTypeListResponse;
  try {
    ticketTypes = await getEventTicketTypes(event.id);
  } catch {
    return (
      <Alert variant="destructive">
        <AlertDescription>{t("ticketsLoadError")}</AlertDescription>
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
          <AlertDescription>{t("invalidPromoterCode")}</AlertDescription>
        </Alert>
      ) : null}
      {showHeader ? (
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">
            {event.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            {format.dateTime(new Date(event.startsAt), {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>
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
