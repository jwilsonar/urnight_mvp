import {
  BookOpen,
  ChatCircleText,
  EnvelopeSimple,
  Question,
  Ticket,
  Wallet,
} from '@phosphor-icons/react/dist/ssr';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Button, Card } from '@urnight/ui';
import { Reveal } from '@/components/shared/reveal';

export const metadata: Metadata = {
  title: 'Centro de ayuda',
  description: 'Encuentra respuestas y contáctanos si necesitas más ayuda.',
};

/** Pantalla 41 del prototipo (Centro de ayuda). Estática, enlaza recursos reales. */
const TEMAS = [
  {
    icon: Ticket,
    title: 'Entradas y compras',
    description: 'Cómo comprar, recibir tu QR y qué hacer si un evento se cancela.',
    href: '/faq',
  },
  {
    icon: Wallet,
    title: 'Pagos y reembolsos',
    description: 'Métodos de pago, tiempos de reembolso y saldo en tu wallet.',
    href: '/faq',
  },
  {
    icon: Question,
    title: 'Cuenta y verificación',
    description: 'Registro, verificación de edad (+18) y recuperación de acceso.',
    href: '/faq',
  },
  {
    icon: BookOpen,
    title: 'Libro de Reclamaciones',
    description: 'Registra formalmente una queja o reclamo sobre el servicio.',
    href: '/reclamaciones',
  },
] as const;

export default function AyudaPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <Reveal>
        <p className="un-eyebrow">Ayuda</p>
        <h1 className="mt-2 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
          ¿En qué te ayudamos?
        </h1>
        <p className="mt-4 max-w-xl leading-relaxed text-muted-foreground">
          Busca tu tema o revisa las preguntas frecuentes. Si no encuentras respuesta, escríbenos.
        </p>
      </Reveal>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {TEMAS.map((tema, i) => {
          const Icon = tema.icon;
          return (
            <Reveal key={tema.title} delay={i * 60}>
              <Link href={tema.href} className="block h-full">
                <Card className="h-full p-5 transition-[border-color,transform,box-shadow] hover:-translate-y-0.5 hover:border-accent-border hover:shadow-float">
                  <span className="flex size-11 items-center justify-center rounded-md border border-accent-border bg-accent">
                    <Icon className="size-5 text-lavender" weight="duotone" />
                  </span>
                  <p className="mt-3.5 font-heading text-base font-bold">{tema.title}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {tema.description}
                  </p>
                </Card>
              </Link>
            </Reveal>
          );
        })}
      </div>

      <Reveal>
        <div className="mt-10 flex flex-col items-center gap-4 rounded-2xl border border-accent-border bg-[linear-gradient(180deg,var(--accent-soft),transparent)] px-6 py-12 text-center">
          <ChatCircleText className="size-9 text-lavender" weight="duotone" />
          <h2 className="font-heading text-xl font-extrabold">¿Aún necesitas ayuda?</h2>
          <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
            Nuestro equipo responde en menos de 24 horas, todos los días.
          </p>
          <Button asChild>
            <a href="mailto:soporte@urnight.pe">
              <EnvelopeSimple className="size-4" weight="duotone" /> Escríbenos
            </a>
          </Button>
        </div>
      </Reveal>
    </div>
  );
}
