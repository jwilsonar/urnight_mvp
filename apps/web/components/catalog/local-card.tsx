import { MapPin, SealCheck } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { LocalResponse } from "@urnight/contracts";
import { Badge, Card, CardContent, cn } from "@urnight/ui";
import { CTA_CLASS } from "@/components/catalog/event-card";
import { HoloCard } from "@/components/motion/holo-card";
import { StorageImage } from "@/lib/storage/storage-context";

export function LocalCard({ local }: { local: LocalResponse }) {
  const t = useTranslations("locals.card");
  const href = `/locals/${local.slug}`;

  return (
    <HoloCard className="h-full" max={7}>
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
      </div>
    </HoloCard>
  );
}
