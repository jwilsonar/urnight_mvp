import {
  CurrencyCircleDollar,
  LinkSimple,
  Receipt,
  Target,
} from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ApplyPromoterForm } from "@/components/promoter/apply-promoter-form";
import { ConversionSplit } from "@/components/shared/conversion-split";
import { requireAccessToken } from "@/lib/auth-helpers";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("promoterApplication");
  return { title: t("metadataTitle") };
}

/** Postulación pública (autenticada) a promotor. Reusa ApplyPromoterForm. */
export default async function ApplyPromoterPage() {
  // Requiere sesión: la postulación se asocia al usuario actual.
  await requireAccessToken("/promotor/postular");
  const t = await getTranslations("promoterApplication");
  const stats = ["events", "venues", "nightOwls"].map((key, index) => ({
    value: ["320+", "85+", "12k"][index]!,
    label: t(`stats.${key}`),
  }));
  const benefits = [LinkSimple, Target, CurrencyCircleDollar, Receipt].map(
    (Icon, index) => ({
      icon: <Icon className="size-5" weight="duotone" aria-hidden />,
      label: t(`benefits.${index + 1}`),
    }),
  );

  return (
    <ConversionSplit
      eyebrow={t("eyebrow")}
      title={t("title")}
      description={t("description")}
      stats={stats}
      benefits={benefits}
      formTitle={t("formTitle")}
      formDescription={<>{t("formDescription")}</>}
    >
      <ApplyPromoterForm />
    </ConversionSplit>
  );
}
