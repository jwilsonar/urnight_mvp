import { MapPin, Ticket, Warning } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Badge, Button } from "@urnight/ui";
import { CartaExperience } from "@/components/carta/carta-experience";
import { EmptyState } from "@/components/shared/empty-state";
import { Reveal } from "@/components/shared/reveal";
import { getLocalBySlug } from "@/lib/api/catalog";
import { getErrorMessage } from "@/lib/api/error-messages";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const t = await getTranslations("carta.page");

  try {
    const local = await getLocalBySlug(slug);
    return {
      title: t("metadataTitle", { name: local.name }),
      description: t("metadataDescription", {
        name: local.name,
        zone: t("defaultPickupZone"),
      }),
    };
  } catch {
    return {
      title: t("metadataFallbackTitle"),
      description: t("metadataFallbackDescription"),
    };
  }
}

export default async function CartaPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ ticket?: string }>;
}) {
  const t = await getTranslations("carta.page");
  const errorT = await getTranslations("auth.errors");
  const { slug } = await params;
  const { ticket } = await searchParams;

  let local;
  try {
    local = await getLocalBySlug(slug);
  } catch (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <EmptyState
          icon={<Warning weight="duotone" />}
          title={t("loadErrorTitle")}
          description={getErrorMessage(error, (key) => errorT(key))}
          action={
            <Button asChild>
              <Link href={`/locals/${slug}`}>{t("backToLocal")}</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const pickupZone = t("defaultPickupZone");

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Reveal>
        <header className="mb-6 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="info">{t("inVenue")}</Badge>
            {ticket ? (
              <Badge variant="success" className="gap-1">
                <Ticket className="size-3" weight="fill" />{" "}
                {t("verifiedTicket")}
              </Badge>
            ) : null}
          </div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            {t("title", { name: local.name })}
          </h1>
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="size-4 shrink-0" weight="duotone" />{" "}
            {t("pickup", { zone: pickupZone })}
          </p>
        </header>
      </Reveal>

      <Reveal delay={60}>
        <p className="mb-6 max-w-2xl text-sm text-muted-foreground">
          {t("description")}
        </p>
      </Reveal>
      <CartaExperience
        localId={local.id}
        localSlug={local.slug}
        pickupZone={pickupZone}
      />
    </div>
  );
}
