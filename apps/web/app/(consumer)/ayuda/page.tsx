import {
  BookOpen,
  ChatCircleText,
  EnvelopeSimple,
  Question,
  Ticket,
  Wallet,
} from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button, Card } from "@urnight/ui";
import { Reveal } from "@/components/shared/reveal";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("ayuda.metadata");
  return { title: t("title"), description: t("description") };
}

/** Pantalla 41 del prototipo (Centro de ayuda). Estática, enlaza recursos reales. */
const TOPICS = [
  {
    icon: Ticket,
    key: "tickets",
    href: "/faq",
  },
  {
    icon: Wallet,
    key: "payments",
    href: "/faq",
  },
  {
    icon: Question,
    key: "account",
    href: "/faq",
  },
  {
    icon: BookOpen,
    key: "complaints",
    href: "/reclamaciones",
  },
] as const;

export default async function AyudaPage() {
  const t = await getTranslations("ayuda");
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <Reveal>
        <p className="rv-eyebrow">{t("eyebrow")}</p>
        <h1 className="mt-2 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
          {t("title")}
        </h1>
        <p className="mt-4 max-w-xl leading-relaxed text-muted-foreground">
          {t("description")}
        </p>
      </Reveal>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {TOPICS.map((topic, i) => {
          const Icon = topic.icon;
          return (
            <Reveal key={topic.key} delay={i * 60}>
              <Link href={topic.href} className="block h-full">
                <Card className="h-full p-5 transition-[border-color,transform,box-shadow] hover:-translate-y-0.5 hover:border-accent-border hover:shadow-float">
                  <span className="flex size-11 items-center justify-center rounded-md border border-accent-border bg-accent">
                    <Icon className="size-5 text-rose" weight="duotone" />
                  </span>
                  <p className="mt-3.5 font-heading text-base font-bold">
                    {t(`topics.${topic.key}.title`)}
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {t(`topics.${topic.key}.description`)}
                  </p>
                </Card>
              </Link>
            </Reveal>
          );
        })}
      </div>

      <Reveal>
        <div className="mt-10 flex flex-col items-center gap-4 rounded-2xl border border-accent-border bg-[linear-gradient(180deg,var(--accent-soft),transparent)] px-6 py-12 text-center">
          <ChatCircleText className="size-9 text-rose" weight="duotone" />
          <h2 className="font-heading text-xl font-extrabold">
            {t("contact.title")}
          </h2>
          <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
            {t("contact.description")}
          </p>
          <Button asChild>
            <a href="mailto:soporte@ravenue.pe">
              <EnvelopeSimple className="size-4" weight="duotone" />{" "}
              {t("contact.action")}
            </a>
          </Button>
        </div>
      </Reveal>
    </div>
  );
}
