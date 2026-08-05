import {
  ChartLineUp,
  LinkSimple,
  QrCode,
  ShieldCheck,
} from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Badge, Card } from "@urnight/ui";
import { AffiliateForm } from "@/components/affiliate/affiliate-form";
import { ConversionSplit } from "@/components/shared/conversion-split";
import { Reveal } from "@/components/shared/reveal";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("affiliate.metadata");
  return { title: t("title"), description: t("description") };
}

/** Solicitud pública de afiliación de un local a RAVENUE. */
export default async function AfiliarPage() {
  const t = await getTranslations("affiliate");
  const stats = ["venues", "events", "nightOwls"].map((key, index) => ({
    value: ["85+", "320+", "12k"][index]!,
    label: t(`stats.${key}`),
  }));
  const benefits = [QrCode, ShieldCheck, LinkSimple, ChartLineUp].map(
    (Icon, index) => ({
      icon: <Icon className="size-5" weight="duotone" aria-hidden />,
      label: t(`benefits.${index + 1}`),
    }),
  );
  const steps = [1, 2, 3].map((number) => ({
    number: String(number),
    title: t(`steps.${number}.title`),
    description: t(`steps.${number}.description`),
  }));

  return (
    <div>
      <ConversionSplit
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("description")}
        stats={stats}
        benefits={benefits}
        formTitle={t("formTitle")}
        formDescription={<>{t("formDescription")}</>}
      >
        <AffiliateForm />
      </ConversionSplit>

      <section
        className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
        aria-labelledby="como-funciona"
      >
        <Reveal>
          <p className="rv-eyebrow">{t("howItWorks")}</p>
          <h2
            id="como-funciona"
            className="mt-2 font-heading text-3xl font-extrabold sm:text-4xl"
          >
            {t("stepsTitle")}
          </h2>
        </Reveal>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {steps.map((step, index) => (
            <Reveal key={step.number} delay={index * 70} className="h-full">
              <Card className="h-full p-6 transition-[border-color,transform,box-shadow] hover:-translate-y-0.5 hover:border-accent-border hover:shadow-float">
                <Badge aria-hidden>{step.number}</Badge>
                <h3 className="mt-5 font-heading text-xl font-bold">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>
    </div>
  );
}
