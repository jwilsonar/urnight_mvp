import {
  CurrencyCircleDollar,
  LinkSimple,
  Receipt,
  Target,
} from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import { ApplyPromoterForm } from "@/components/promoter/apply-promoter-form";
import { ConversionSplit } from "@/components/shared/conversion-split";
import { requireAccessToken } from "@/lib/auth-helpers";

export const metadata: Metadata = { title: "Postular a promotor" };

const STATS = [
  { value: "320+", label: "Eventos al mes" },
  { value: "85+", label: "Locales" },
  { value: "12k", label: "Noctámbulos" },
] as const;

const BENEFITS = [
  {
    icon: <LinkSimple className="size-5" weight="duotone" aria-hidden />,
    label: "Tu link propio: tus invitados sacan su código solos",
  },
  {
    icon: <Target className="size-5" weight="duotone" aria-hidden />,
    label: "Metas y bonos claros, sin discusiones de Excel",
  },
  {
    icon: (
      <CurrencyCircleDollar className="size-5" weight="duotone" aria-hidden />
    ),
    label: "Comisión por venta de box y mesa",
  },
  {
    icon: <Receipt className="size-5" weight="duotone" aria-hidden />,
    label: "Liquidaciones transparentes",
  },
] as const;

/** Postulación pública (autenticada) a promotor. Reusa ApplyPromoterForm. */
export default async function ApplyPromoterPage() {
  // Requiere sesión: la postulación se asocia al usuario actual.
  await requireAccessToken("/promotor/postular");

  return (
    <ConversionSplit
      eyebrow="Para promotores"
      title="Haz crecer tu comunidad y cobra con cuentas claras"
      description="Lleva a tu gente a las mejores noches con herramientas que registran cada invitado, venta y comisión sin trabajo manual."
      stats={STATS}
      benefits={BENEFITS}
      formTitle="Conviértete en promotor"
      formDescription={
        <>
          Postula para vender entradas y ganar comisiones por tus referidos. Un
          local revisará tu solicitud.
        </>
      }
    >
      <ApplyPromoterForm />
    </ConversionSplit>
  );
}
