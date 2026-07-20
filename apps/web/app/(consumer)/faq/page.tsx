import { ChatCircleText, EnvelopeSimple } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import { Button } from "@urnight/ui";
import { FaqBrowser } from "@/components/shared/faq-browser";
import { Reveal } from "@/components/shared/reveal";

export const metadata: Metadata = {
  title: "Preguntas frecuentes",
  description: "Resolvemos las dudas más comunes sobre cómo usar RAVENUE.",
};

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <Reveal>
        <p className="rv-eyebrow">Ayuda</p>
        <h1 className="mt-2 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
          Preguntas frecuentes
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          Resolvemos las dudas más comunes sobre cómo usar RAVENUE.
        </p>
      </Reveal>
      <div className="mt-10">
        <FaqBrowser />
      </div>

      <Reveal>
        <div className="mt-10 flex flex-col items-center gap-4 rounded-2xl border border-accent-border bg-[linear-gradient(180deg,var(--accent-soft),transparent)] px-6 py-12 text-center">
          <ChatCircleText className="size-9 text-rose" weight="duotone" />
          <h2 className="font-heading text-xl font-extrabold">
            ¿Aún necesitas ayuda?
          </h2>
          <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
            Nuestro equipo responde en menos de 24 horas, todos los días.
          </p>
          <Button asChild>
            <a href="mailto:soporte@ravenue.pe">
              <EnvelopeSimple className="size-4" weight="duotone" /> Escríbenos
            </a>
          </Button>
        </div>
      </Reveal>
    </div>
  );
}
