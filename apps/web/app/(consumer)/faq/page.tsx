import { ChatCircleText, EnvelopeSimple } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Button } from "@urnight/ui";
import { FaqBrowser } from "@/components/shared/faq-browser";
import { Reveal } from "@/components/shared/reveal";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("faq.page.metadata");
  return { title: t("title"), description: t("description") };
}

export default async function FaqPage() {
  const t = await getTranslations("faq.page");
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <Reveal>
        <p className="rv-eyebrow">{t("eyebrow")}</p>
        <h1 className="mt-2 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
          {t("title")}
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          {t("description")}
        </p>
      </Reveal>
      <div className="mt-10">
        <FaqBrowser />
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
