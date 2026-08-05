import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Badge, Card } from "@urnight/ui";
import { FriendsDemo } from "@/components/account/friends-demo";
import { Reveal } from "@/components/shared/reveal";
import { AMIGOS_DEMO, SOLICITUDES_DEMO } from "@/lib/mock/social";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("account.friends");
  return { title: t("title") };
}

export default async function AmigosPage() {
  const t = await getTranslations("account.friends");
  const eventosCompartidos = AMIGOS_DEMO.reduce(
    (total, amigo) => total + amigo.eventosJuntos,
    0,
  );

  return (
    <div className="space-y-8">
      <Reveal>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="font-heading text-2xl font-extrabold tracking-tight">
              {t("title")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t("pageDescription")}
            </p>
          </div>
          <Badge variant="info">{t("demo")}</Badge>
        </div>
      </Reveal>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: t("kpis.total"), value: AMIGOS_DEMO.length },
          { label: t("kpis.requests"), value: SOLICITUDES_DEMO.length },
          { label: t("kpis.events"), value: eventosCompartidos },
        ].map((kpi, index) => (
          <Reveal key={kpi.label} delay={60 + index * 60}>
            <Card className="p-5">
              <p className="rv-eyebrow !text-muted-foreground">{kpi.label}</p>
              <p className="mt-1 font-heading text-3xl font-extrabold tabular-nums">
                {kpi.value}
              </p>
            </Card>
          </Reveal>
        ))}
      </div>

      <Reveal delay={220}>
        <FriendsDemo />
      </Reveal>
    </div>
  );
}
