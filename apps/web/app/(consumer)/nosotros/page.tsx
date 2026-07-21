import {
  Buildings,
  ShieldCheck,
  Target,
  UsersThree,
} from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import type { CSSProperties } from "react";
import { Card } from "@urnight/ui";
import { Reveal } from "@/components/shared/reveal";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("about.metadata");
  return { title: t("title"), description: t("description") };
}

/** Historia de RAVENUE: el texto original se conserva y cambia su jerarquía visual. */
const SECTIONS = [
  {
    icon: Target,
    key: "mission",
  },
  {
    icon: UsersThree,
    key: "whatWeDo",
  },
  {
    icon: Buildings,
    key: "venues",
  },
  {
    icon: ShieldCheck,
    key: "commitment",
  },
] as const;

export default async function NosotrosPage() {
  const t = await getTranslations("about");
  const stats = ["events", "venues", "nightOwls"].map((key, index) => ({
    value: ["320+", "85", "12k"][index]!,
    label: t(`stats.${key}`),
  }));

  return (
    <div>
      <section className="rv-hero-glow border-b">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
          <div>
            <Reveal>
              <p className="rv-eyebrow">{t("eyebrow")}</p>
              <h1 className="mt-3 max-w-4xl font-display text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
                {t("title")}
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                {t("description")}
              </p>
            </Reveal>

            <Reveal delay={120}>
              <dl className="mt-14 flex flex-wrap gap-x-12 gap-y-6 text-sm text-muted-foreground">
                {stats.map((stat) => (
                  <div key={stat.label}>
                    <dd className="font-heading text-3xl font-extrabold text-foreground">
                      {stat.value}
                    </dd>
                    <dt>{stat.label}</dt>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>

          <div
            aria-hidden
            className="pointer-events-none relative min-h-80 overflow-hidden lg:min-h-[440px]"
          >
            <div className="absolute inset-12 rounded-full bg-primary/10 blur-3xl" />
            <Image
              src="/brand/icon-mark.png"
              alt=""
              width={632}
              height={622}
              className="absolute left-1/2 top-1/2 w-full max-w-[420px] -translate-x-1/2 -translate-y-1/2 -rotate-6 opacity-10"
            />
            <div
              className="rv-float absolute right-[8%] top-[8%] h-48 w-36 rounded-xl border border-accent-border bg-[linear-gradient(150deg,var(--rv-wine),var(--bg-card))] p-4 shadow-glow"
              style={
                {
                  "--drift-rot": "7deg",
                  "--drift-y": "-14px",
                  "--drift-dur": "8s",
                } as CSSProperties
              }
            >
              <div className="h-2 w-16 rounded-full bg-white/20" />
              <div className="mt-3 h-24 rounded-lg bg-[linear-gradient(145deg,var(--accent-soft-strong),transparent)]" />
              <div className="mt-3 h-2 w-20 rounded-full bg-white/10" />
            </div>
            <div
              className="rv-float absolute bottom-[5%] left-[6%] h-44 w-32 rounded-xl border border-accent-border bg-[linear-gradient(155deg,var(--bg-elevated),var(--rv-wine))] p-4 shadow-float"
              style={
                {
                  "--drift-rot": "-9deg",
                  "--drift-y": "12px",
                  "--drift-dur": "10s",
                } as CSSProperties
              }
            >
              <div className="h-20 rounded-lg border border-white/10 bg-primary/15" />
              <div className="mt-4 h-2 w-16 rounded-full bg-white/20" />
              <div className="mt-2 h-2 w-10 rounded-full bg-white/10" />
            </div>
            <div
              className="rv-float absolute bottom-[12%] right-[18%] h-36 w-28 rounded-xl border border-white/10 bg-[linear-gradient(145deg,var(--rv-crimson),var(--rv-wine))] p-3 opacity-80 shadow-glow"
              style={
                {
                  "--drift-rot": "4deg",
                  "--drift-y": "10px",
                  "--drift-dur": "7s",
                } as CSSProperties
              }
            >
              <div className="h-16 rounded-md bg-black/20" />
              <div className="mt-3 h-2 w-14 rounded-full bg-white/25" />
            </div>
          </div>
        </div>
      </section>

      <section
        className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
        aria-labelledby="nuestra-historia"
      >
        <Reveal>
          <p className="rv-eyebrow">{t("history.eyebrow")}</p>
          <h2
            id="nuestra-historia"
            className="mt-2 font-heading text-3xl font-extrabold sm:text-4xl"
          >
            {t("history.title")}
          </h2>
        </Reveal>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {SECTIONS.map((section, index) => {
            const Icon = section.icon;
            return (
              <Reveal key={section.key} delay={index * 80} className="h-full">
                <Card className="h-full p-6 transition-[transform,border-color] duration-200 hover:-translate-y-0.5 hover:border-[var(--rv-border-soft)] motion-reduce:transform-none">
                  <span className="flex size-11 items-center justify-center rounded-md border border-accent-border bg-accent text-rose">
                    <Icon className="size-5" weight="duotone" aria-hidden />
                  </span>
                  <h3 className="mt-4 font-heading text-xl font-bold">
                    {t(`sections.${section.key}.title`)}
                  </h3>
                  <p className="mt-2 leading-relaxed text-muted-foreground">
                    {t(`sections.${section.key}.body`)}
                  </p>
                </Card>
              </Reveal>
            );
          })}
        </div>
      </section>
    </div>
  );
}
