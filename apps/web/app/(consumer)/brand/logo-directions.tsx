import Image from "next/image";
import { useTranslations } from "next-intl";
import { Badge, Card } from "@urnight/ui";

const FINAL_ASSETS = [
  {
    key: "wordmark",
    src: "/brand/wordmark.png",
    width: 1168,
    height: 104,
    imageClassName: "h-auto w-full max-w-xl",
    primary: true,
  },
  {
    key: "icon",
    src: "/brand/icon-mark.png",
    width: 632,
    height: 622,
    imageClassName: "size-32 object-contain sm:size-40",
    primary: false,
  },
] as const;

/** Activos definitivos del sistema de marca. */
export function LogoDirections() {
  const t = useTranslations("brand.logo");
  return (
    <>
      <div className="grid gap-4 lg:grid-cols-2">
        {FINAL_ASSETS.map((asset) => (
          <Card
            key={asset.key}
            className="flex h-full flex-col overflow-hidden"
          >
            <div className="flex min-h-56 items-center justify-center border-b bg-surface px-8 py-10">
              <Image
                src={asset.src}
                alt={t(`assets.${asset.key}.title`)}
                width={asset.width}
                height={asset.height}
                className={asset.imageClassName}
              />
            </div>
            <div className="flex flex-1 flex-col p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h3 className="font-heading text-lg font-bold">
                  {t(`assets.${asset.key}.title`)}
                </h3>
                {asset.primary ? <Badge>{t("primary")}</Badge> : null}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {t(`assets.${asset.key}.description`)}
              </p>
              <p className="mt-5 text-sm">
                <strong>{t("usage")}:</strong>{" "}
                <span className="text-muted-foreground">
                  {t(`assets.${asset.key}.usage`)}
                </span>
              </p>
            </div>
          </Card>
        ))}
      </div>
      <p className="mt-5 rounded-md border border-accent-border bg-accent px-4 py-3 text-sm text-muted-foreground">
        <strong className="text-[var(--rv-rose)]">{t("historyLabel")}:</strong>{" "}
        {t("history")}
      </p>
    </>
  );
}
