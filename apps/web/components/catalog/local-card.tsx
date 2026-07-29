import { MapPin, SealCheck } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { LocalResponse } from "@urnight/contracts";
import { Badge, Card, CardContent } from "@urnight/ui";
import { StorageImage } from "@/lib/storage/storage-context";

export function LocalCard({ local }: { local: LocalResponse }) {
  const t = useTranslations("locals.card");
  const href = `/locals/${local.slug}`;

  return (
    <div className="group relative h-full rounded-lg focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background">
      <Card className="relative flex h-full cursor-pointer flex-col overflow-hidden group-hover:border-accent-border group-hover:shadow-float group-focus-within:border-accent-border group-focus-within:shadow-float">
        <span
          aria-hidden
          className="rv-catalog-card-hover pointer-events-none absolute inset-0 z-[1] opacity-0 transition-opacity duration-300 ease-[var(--ease-brand)] group-hover:opacity-100 group-focus-within:opacity-100 motion-reduce:transition-none"
        />
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
            <Link
              href={href}
              className="outline-none after:absolute after:inset-0 after:z-10 after:content-['']"
            >
              {local.name}
            </Link>
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
          <div className="!mt-auto border-t pt-3.5">
            <span className="text-xs text-muted-foreground">
              {t("features")}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
