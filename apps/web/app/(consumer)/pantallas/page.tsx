import { ArrowUpRight, Eye } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Badge, Card } from "@urnight/ui";
import { Reveal } from "@/components/shared/reveal";

type Status = "real" | "demo" | "mixta";
type Screen = { route: string; name: string; status: Status; note?: string };
type Group = { title: string; description?: string; screens: Screen[] };

const STATUS_VARIANT: Record<Status, "success" | "info" | "warning"> = {
  real: "success",
  demo: "info",
  mixta: "warning",
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("screens.metadata");
  return {
    title: t("title"),
    description: t("description"),
    robots: { index: false, follow: false },
  };
}

export default async function PantallasPage() {
  const t = await getTranslations("screens");
  const groups = t.raw("groups") as Group[];
  const total = groups.reduce((sum, group) => sum + group.screens.length, 0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <Reveal>
        <p className="rv-eyebrow flex items-center gap-2">
          <Eye className="size-4" weight="duotone" /> {t("eyebrow")}
        </p>
        <h1 className="mt-2 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
          {t("title")}
        </h1>
        <p className="mt-4 max-w-2xl leading-relaxed text-muted-foreground">
          {t("summary", { total })}{" "}
          <Badge variant="success">{t("status.real")}</Badge>{" "}
          {t("status.realDescription")}{" "}
          <Badge variant="info">{t("status.demo")}</Badge>{" "}
          {t("status.demoDescription")}
        </p>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {t("note")}
        </p>
      </Reveal>

      {groups.map((group) => (
        <section key={group.title} className="mt-12">
          <Reveal>
            <h2 className="font-heading text-xl font-extrabold tracking-tight">
              {group.title}
            </h2>
            {group.description ? (
              <p className="mt-1 text-sm text-muted-foreground">
                {group.description}
              </p>
            ) : null}
          </Reveal>
          <div className="mt-5 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            {group.screens.map((screen, index) => (
              <Reveal
                key={`${group.title}-${screen.name}`}
                delay={(index % 3) * 60}
              >
                <Link href={screen.route} className="block h-full">
                  <Card className="flex h-full flex-col p-4 transition-[border-color,transform,box-shadow] hover:-translate-y-0.5 hover:border-accent-border hover:shadow-float">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-heading text-[15px] font-bold leading-tight">
                        {screen.name}
                      </p>
                      <ArrowUpRight className="size-4 shrink-0 text-rose" />
                    </div>
                    <p className="mt-1 font-mono text-xs text-muted-foreground">
                      {screen.route}
                    </p>
                    {screen.note ? (
                      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                        {screen.note}
                      </p>
                    ) : null}
                    <div className="mt-auto pt-3">
                      <Badge variant={STATUS_VARIANT[screen.status]}>
                        {t(`status.${screen.status}`)}
                      </Badge>
                    </div>
                  </Card>
                </Link>
              </Reveal>
            ))}
          </div>
        </section>
      ))}

      <Reveal>
        <p className="mt-12 rounded-md border border-info-border bg-info-soft px-4 py-3 text-sm leading-relaxed text-info">
          {t.rich("storybook", {
            code: (chunks: React.ReactNode) => (
              <code className="font-mono">{chunks}</code>
            ),
          })}
        </p>
      </Reveal>
    </div>
  );
}
