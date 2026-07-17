import {
  ChartLineUp,
  LinkSimple,
  QrCode,
  ShieldCheck,
} from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import { Badge, Card } from "@urnight/ui";
import { AffiliateForm } from "@/components/affiliate/affiliate-form";
import { ConversionSplit } from "@/components/shared/conversion-split";
import { Reveal } from "@/components/shared/reveal";

export const metadata: Metadata = {
  title: "Afilia tu local",
  description: "Suma tu discoteca o bar a UrNight y empieza a vender entradas.",
};

const STATS = [
  { value: "85+", label: "Locales" },
  { value: "320+", label: "Eventos al mes" },
  { value: "12k", label: "Noctámbulos" },
] as const;

const BENEFITS = [
  {
    icon: <QrCode className="size-5" weight="duotone" aria-hidden />,
    label: "Puerta rápida sin colas",
  },
  {
    icon: <ShieldCheck className="size-5" weight="duotone" aria-hidden />,
    label: "Reservas verificables sin reclamos",
  },
  {
    icon: <LinkSimple className="size-5" weight="duotone" aria-hidden />,
    label: "Promotores con link propio y metas claras",
  },
  {
    icon: <ChartLineUp className="size-5" weight="duotone" aria-hidden />,
    label: "Reporte semanal listo para tu reunión",
  },
] as const;

const STEPS = [
  {
    number: "1",
    title: "Afíliate",
    description:
      "Cuéntanos sobre tu local y nuestro equipo revisará la solicitud contigo.",
  },
  {
    number: "2",
    title: "Configura tu política",
    description:
      "Define zonas, reservas y promotores según cómo funciona realmente tu operación.",
  },
  {
    number: "3",
    title: "Opera sin Excel",
    description:
      "Controla ventas, accesos y resultados desde un flujo compartido por todo tu equipo.",
  },
] as const;

/** Solicitud pública de afiliación de un local a UrNight. */
export default function AfiliarPage() {
  return (
    <div>
      <ConversionSplit
        eyebrow="Para locales"
        title="Tu discoteca, llena y sin caos en la puerta"
        description="Centraliza entradas, reservas y promotores para que tu equipo opere la noche con información clara, desde la venta hasta el ingreso."
        stats={STATS}
        benefits={BENEFITS}
        formTitle="Afilia tu local a UrNight"
        formDescription={
          <>
            Vende entradas, gestiona eventos y llega a más gente. Déjanos tus
            datos y te contactamos.
          </>
        }
      >
        <AffiliateForm />
      </ConversionSplit>

      <section
        className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
        aria-labelledby="como-funciona"
      >
        <Reveal>
          <p className="un-eyebrow">Cómo funciona</p>
          <h2
            id="como-funciona"
            className="mt-2 font-heading text-3xl font-extrabold sm:text-4xl"
          >
            De la solicitud a una operación ordenada
          </h2>
        </Reveal>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {STEPS.map((step, index) => (
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
