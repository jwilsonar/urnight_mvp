import {
  ArrowUUpLeft,
  Info,
  MapPin,
  SealCheck,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { LocalResponse } from "@urnight/contracts";
import { Badge, Card, CardContent, cn } from "@urnight/ui";
import { CTA_CLASS, ICON_BTN_CLASS } from "@/components/catalog/event-card";
import { HoloCard, HoloFlipButton } from "@/components/motion/holo-card";
import { StorageImage } from "@/lib/storage/storage-context";

export function LocalCard({ local }: { local: LocalResponse }) {
  const t = useTranslations("locals.card");
  const href = `/locals/${local.slug}`;

  return (
    <HoloCard
      className="h-full"
      max={7}
      trigger="slot"
      back={<LocalCardBack local={local} href={href} />}
    >
      <div className="group relative h-full rounded-lg">
        <Card className="flex h-full flex-col overflow-hidden group-hover:border-accent-border group-hover:shadow-float">
          <div className="rv-zoom-img relative aspect-[4/3] overflow-hidden">
            {local.mainImageUrl ? (
              <StorageImage
                src={local.mainImageUrl}
                alt={local.name}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover group-hover:scale-105"
              />
            ) : (
              <div className="rv-img-ph absolute inset-0">
                <span>{t("facade")}</span>
              </div>
            )}
            {local.isVerified ? (
              <Badge
                variant="success"
                className="absolute left-2 top-2 gap-1 bg-deep/90 backdrop-blur-sm"
              >
                <SealCheck className="h-3 w-3" weight="fill" /> {t("verified")}
              </Badge>
            ) : null}
          </div>
          <CardContent className="flex flex-1 flex-col space-y-1.5 p-4">
            <h3 className="line-clamp-1 font-heading text-[17px] font-bold leading-tight">
              {local.name}
            </h3>
            {local.address ? (
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="size-3.5 shrink-0" weight="duotone" />
                <span className="line-clamp-1">{local.address}</span>
              </p>
            ) : null}
            {local.description ? (
              <p className="line-clamp-2 text-[13px] leading-relaxed text-muted-foreground/80">
                {local.description}
              </p>
            ) : null}
            <div className="!mt-auto flex items-center justify-between border-t pt-3.5">
              <span className="text-xs text-muted-foreground">
                {t("features")}
              </span>
              <Link
                href={href}
                className={cn(
                  CTA_CLASS,
                  "outline-none transition-transform group-hover:scale-[1.03] focus-visible:ring-2 focus-visible:ring-ring",
                )}
              >
                {t("viewVenue")}
              </Link>
            </div>
          </CardContent>
        </Card>
        <HoloFlipButton
          label={t("viewInformation")}
          className={cn(ICON_BTN_CLASS, "absolute right-2 top-2 z-[5]")}
        >
          <Info className="size-4" weight="duotone" />
        </HoloFlipButton>
      </div>
    </HoloCard>
  );
}

function LocalCardBack({
  local,
  href,
}: {
  local: LocalResponse;
  href: string;
}) {
  const t = useTranslations("locals.card");

  return (
    <Card className="flex h-full flex-col overflow-hidden border-accent-border">
      <CardContent className="flex min-h-0 flex-1 flex-col p-4">
        <p className="rv-eyebrow flex items-center gap-1.5">
          <MapPin className="size-3.5" weight="duotone" />
          {t("detail")}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <h3 className="font-heading text-[17px] font-bold leading-tight">
            {local.name}
          </h3>
          {local.isVerified ? (
            <Badge variant="success">{t("verified")}</Badge>
          ) : null}
        </div>
        {local.address ? (
          <p className="mt-3 flex items-start gap-1.5 text-sm text-muted-foreground">
            <MapPin className="mt-0.5 size-3.5 shrink-0" weight="duotone" />
            <span>{local.address}</span>
          </p>
        ) : null}
        <div className="mt-3 min-h-0 flex-1 overflow-y-auto">
          <p className="text-sm leading-relaxed text-muted-foreground">
            {local.description ?? t("fallbackDescription")}
          </p>
        </div>
        <div className="mt-3 flex items-center gap-2 border-t pt-3.5">
          <HoloFlipButton label={t("flipBack")} className={ICON_BTN_CLASS}>
            <ArrowUUpLeft className="size-4" weight="bold" />
          </HoloFlipButton>
          <Link
            href={href}
            className={cn(
              CTA_CLASS,
              "flex-1 outline-none focus-visible:ring-2 focus-visible:ring-ring",
            )}
          >
            {t("viewVenue")}
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
