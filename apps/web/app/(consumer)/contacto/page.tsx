import { ChatCircleText, EnvelopeSimple } from '@phosphor-icons/react/dist/ssr';
import type { Metadata } from 'next';
import { Card, CardContent } from '@urnight/ui';
import { ContactForm } from '@/components/contact/contact-form';
import { Reveal } from '@/components/shared/reveal';

export const metadata: Metadata = {
  title: 'Contacto',
  description: 'Ponte en contacto con el equipo de RAVENUE.',
};

export default function ContactoPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <Reveal>
        <p className="rv-eyebrow">Estamos para ayudarte</p>
        <h1 className="mt-2 font-heading text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          Contáctanos
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Cuéntanos qué necesitas y prepararemos tu mensaje para nuestro equipo de soporte.
        </p>
      </Reveal>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_280px]">
        <Reveal delay={70}>
          <Card>
            <CardContent className="p-6 sm:p-8">
              <ContactForm />
            </CardContent>
          </Card>
        </Reveal>
        <Reveal delay={120}>
          <aside className="space-y-4 rounded-lg border bg-card p-6">
            <span className="flex size-11 items-center justify-center rounded-md border border-accent-border bg-accent text-rose">
              <ChatCircleText className="size-5" weight="duotone" />
            </span>
            <div>
              <h2 className="font-heading text-lg font-bold text-foreground">Atención RAVENUE</h2>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Al enviar, se abrirá tu aplicación de correo para completar el envío.
              </p>
            </div>
            <a
              className="inline-flex items-center gap-2 text-sm font-semibold text-foreground hover:underline"
              href="mailto:soporte@ravenue.pe"
            >
              <EnvelopeSimple className="size-4 text-rose" /> soporte@ravenue.pe
            </a>
          </aside>
        </Reveal>
      </div>
    </div>
  );
}
