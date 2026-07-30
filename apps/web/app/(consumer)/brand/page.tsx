import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
} from "@urnight/ui";
import { LogoDirections } from "./logo-directions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("brand");
  return { title: t("metadataTitle") };
}

const PALETTE = [
  {
    key: "obsidian",
    hex: "#0A0A0D",
    swatch: "bg-[var(--rv-obsidian)]",
  },
  {
    key: "charcoal",
    hex: "#16181B",
    swatch: "bg-surface",
  },
  {
    key: "elevated",
    hex: "#1D2127",
    swatch: "bg-elevated",
  },
  {
    key: "crimson",
    hex: "#EA0526",
    swatch: "bg-primary",
  },
  {
    key: "wine",
    hex: "#7A0F1F",
    swatch: "bg-[var(--rv-wine)]",
  },
  {
    key: "white",
    hex: "#F5F5F7",
    swatch: "bg-foreground",
  },
  {
    key: "smoke",
    hex: "#A3A8B3",
    swatch: "bg-[var(--rv-smoke)]",
  },
  {
    key: "steel",
    hex: "#2F3440",
    swatch: "bg-[var(--rv-steel)]",
  },
  {
    key: "soft",
    hex: "#3A404D",
    swatch: "bg-[var(--rv-border-soft)]",
  },
] as const;

const MOTION = [
  { key: "fast", value: "120ms" },
  { key: "normal", value: "220ms" },
  { key: "slow", value: "360ms" },
] as const;

type VoiceRow = { context: string; messages: string[] };

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-8 max-w-3xl">
      <p className="rv-eyebrow">{eyebrow}</p>
      <h2 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-3 leading-relaxed text-muted-foreground">
          {description}
        </p>
      ) : null}
    </div>
  );
}

export default async function BrandLabPage() {
  const t = await getTranslations("brand");
  const messages = t.raw("voice.rows") as VoiceRow[];
  return (
    <div className="bg-root">
      <section className="border-b bg-[image:var(--gradient-brand)]">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <p className="rv-eyebrow">{t("hero.eyebrow")}</p>
          <h1 className="sr-only">RAVENUE</h1>
          <div className="mt-8 w-full max-w-3xl rounded-xl border border-white/15 bg-[var(--rv-obsidian)] p-6 shadow-overlay sm:p-8">
            <p className="text-xs font-bold uppercase tracking-wider text-white/70">
              {t("logo.darkBackground")}
            </p>
            <Image
              src="/brand/lockup-horizontal.png"
              alt="RAVENUE"
              width={1274}
              height={235}
              priority
              className="mt-4 h-auto w-full"
            />
          </div>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            {t("hero.tagline")}
          </p>
        </div>
      </section>

      <section
        className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
        aria-labelledby="logos-title"
      >
        <div id="logos-title">
          <SectionHeading
            eyebrow={t("logo.eyebrow")}
            title={t("logo.title")}
            description={t("logo.description")}
          />
        </div>
        <LogoDirections />
      </section>

      <section className="border-y bg-deep" aria-labelledby="palette-title">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div id="palette-title">
            <SectionHeading
              eyebrow={t("color.eyebrow")}
              title={t("color.title")}
              description={t("color.description")}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PALETTE.map((color) => (
              <article
                key={color.key}
                className="overflow-hidden rounded-lg border bg-card"
              >
                <div
                  className={`h-32 border-b ${color.swatch}`}
                  aria-hidden="true"
                />
                <div className="p-4">
                  <h3 className="font-bold">
                    {t(`color.palette.${color.key}.name`)}
                  </h3>
                  <p className="mt-1 font-mono text-xs text-[var(--rv-rose)]">
                    {color.hex}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {t(`color.palette.${color.key}.use`)}
                  </p>
                </div>
              </article>
            ))}
          </div>
          <div className="mt-8 rounded-lg border bg-card p-5">
            <div className="flex items-center justify-between gap-4 text-sm">
              <strong>{t("color.composition")}</strong>
              <span className="text-muted-foreground">70 / 20 / 10</span>
            </div>
            <div
              className="mt-4 flex h-5 overflow-hidden rounded-full"
              aria-label={t("color.compositionAria")}
            >
              <span className="w-[70%] bg-[var(--rv-obsidian)]" />
              <span className="w-[20%] bg-foreground" />
              <span className="w-[10%] bg-primary" />
            </div>
          </div>
        </div>
      </section>

      <section
        className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
        aria-labelledby="type-title"
      >
        <div id="type-title">
          <SectionHeading
            eyebrow={t("typography.eyebrow")}
            title={t("typography.title")}
          />
        </div>
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="p-6 sm:p-8">
            <p className="font-display text-4xl font-bold leading-tight sm:text-6xl">
              {t("typography.displaySample")}
            </p>
            <p className="mt-5 text-sm text-muted-foreground">
              {t("typography.displayUsage")}
            </p>
          </Card>
          <Card className="p-6 sm:p-8">
            <p className="text-lg leading-relaxed">
              {t("typography.bodySample")}
            </p>
            <div className="mt-6 overflow-hidden rounded-md border text-sm">
              <div className="grid grid-cols-2 border-b bg-surface px-4 py-3 font-bold">
                <span>{t("typography.scale")}</span>
                <span>{t("typography.usage")}</span>
              </div>
              <div className="grid grid-cols-2 px-4 py-3 text-muted-foreground">
                <span>Inter 14–16</span>
                <span>{t("typography.uiReading")}</span>
              </div>
            </div>
            <p className="mt-5 text-sm text-muted-foreground">
              {t("typography.bodyUsage")}
            </p>
          </Card>
        </div>
      </section>

      <section className="border-y bg-deep" aria-labelledby="components-title">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div id="components-title">
            <SectionHeading
              eyebrow={t("components.eyebrow")}
              title={t("components.title")}
              description={t("components.description")}
            />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="p-6">
              <h3 className="font-heading text-lg font-bold">
                {t("components.actions")}
              </h3>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Button>{t("components.default")}</Button>
                <Button className="bg-primary-hover">
                  {t("components.hover")}
                </Button>
                <Button disabled>{t("components.disabled")}</Button>
                <Button variant="secondary">{t("components.secondary")}</Button>
                <Badge>RAVENUE Select</Badge>
              </div>
              <div className="mt-7">
                <label
                  htmlFor="brand-lab-email"
                  className="mb-2 block text-sm font-bold"
                >
                  {t("components.invitationEmail")}
                </label>
                <Input
                  id="brand-lab-email"
                  type="email"
                  placeholder={t("components.emailPlaceholder")}
                />
              </div>
            </Card>
            <Card>
              <CardHeader>
                <Badge className="w-fit">{t("components.tonight")}</Badge>
                <CardTitle className="pt-3">
                  {t("components.session")}
                </CardTitle>
                <CardDescription>
                  {t("components.cardDescription")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border bg-surface p-4">
                  <p className="font-bold">{t("components.location")}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t("components.access")}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section
        className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
        aria-labelledby="contrast-title"
      >
        <div id="contrast-title">
          <SectionHeading
            eyebrow={t("semantics.eyebrow")}
            title={t("semantics.title")}
          />
        </div>
        <div className="grid overflow-hidden rounded-lg border sm:grid-cols-2">
          <div className="bg-primary p-8 text-primary-foreground">
            <p className="font-display text-2xl font-bold">Ravenue Crimson</p>
            <p className="mt-2 font-mono text-sm">--primary · #EA0526</p>
          </div>
          <div className="bg-error p-8 text-white">
            <p className="font-display text-2xl font-bold">
              {t("semantics.error")}
            </p>
            <p className="mt-2 font-mono text-sm">--error · #EF4444</p>
          </div>
        </div>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          {t("semantics.description")}
        </p>
      </section>

      <section className="border-y bg-deep" aria-labelledby="messages-title">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div id="messages-title">
            <SectionHeading
              eyebrow={t("voice.eyebrow")}
              title={t("voice.title")}
            />
          </div>
          <div className="overflow-x-auto rounded-lg border bg-card">
            <table className="w-full min-w-2xl border-collapse text-left text-sm">
              <thead className="bg-surface text-foreground">
                <tr>
                  <th scope="col" className="px-5 py-4 font-bold">
                    {t("voice.context")}
                  </th>
                  <th scope="col" className="px-5 py-4 font-bold">
                    {t("voice.messages")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {messages.map((row) => (
                  <tr key={row.context} className="border-t">
                    <th
                      scope="row"
                      className="px-5 py-4 align-top font-bold text-[var(--rv-rose)]"
                    >
                      {row.context}
                    </th>
                    <td className="px-5 py-4 text-muted-foreground">
                      {row.messages.join(" / ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section
        className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
        aria-labelledby="gradient-title"
      >
        <div id="gradient-title">
          <SectionHeading
            eyebrow={t("atmosphere.eyebrow")}
            title={t("atmosphere.title")}
          />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border bg-[image:var(--gradient-brand)] p-8 sm:p-12">
            <p className="max-w-xl font-display text-3xl font-bold sm:text-4xl">
              {t("atmosphere.depth")}
            </p>
            <code className="mt-8 block overflow-x-auto rounded-md border bg-root/80 p-4 text-xs text-[var(--rv-rose)]">
              --gradient-brand: linear-gradient(135deg, #0A0A0D 0%, #16181B 55%,
              #7A0F1F 100%);
            </code>
          </div>
          <div className="rounded-xl border bg-[image:var(--gradient-luxury)] p-8 sm:p-12">
            <p className="max-w-xl font-display text-3xl font-bold sm:text-4xl">
              {t("atmosphere.luxury")}
            </p>
            <code className="mt-8 block overflow-x-auto rounded-md border bg-root/80 p-4 text-xs text-[var(--rv-rose)]">
              --gradient-luxury: linear-gradient(90deg, #0A0A0D 0%, #7A0F1F
              100%);
            </code>
          </div>
        </div>
      </section>

      <section className="border-t bg-deep" aria-labelledby="motion-title">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div id="motion-title">
            <SectionHeading
              eyebrow={t("motion.eyebrow")}
              title={t("motion.title")}
              description={t("motion.description")}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {MOTION.map((token) => (
              <Card key={token.key} className="p-6">
                <p className="rv-eyebrow">
                  {t(`motion.tokens.${token.key}.name`)}
                </p>
                <p className="mt-3 font-mono text-2xl font-medium text-foreground">
                  {token.value}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t(`motion.tokens.${token.key}.use`)}
                </p>
              </Card>
            ))}
          </div>
          <div className="mt-4 grid gap-4 font-mono text-sm text-muted-foreground lg:grid-cols-2">
            <code className="rounded-md border bg-card p-4">
              standard · cubic-bezier(0.4, 0, 0.2, 1)
            </code>
            <code className="rounded-md border bg-card p-4">
              out · cubic-bezier(0, 0, 0.2, 1)
            </code>
          </div>
        </div>
      </section>
    </div>
  );
}
