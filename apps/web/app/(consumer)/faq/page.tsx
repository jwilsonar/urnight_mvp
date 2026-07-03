import { CaretDown } from '@phosphor-icons/react/dist/ssr';
import type { Metadata } from 'next';
import { Reveal } from '@/components/shared/reveal';

export const metadata: Metadata = {
  title: 'Preguntas frecuentes',
  description: 'Resolvemos las dudas más comunes sobre cómo usar UrNight.',
};

/** FAQ del prototipo. Acordeón nativo (details/summary), sin JS. */
const FAQS: Array<[string, string]> = [
  [
    '¿Cómo compro una entrada?',
    'Elige el evento, selecciona el tipo de entrada y la cantidad, ingresa tus datos y paga de forma segura. Recibirás tu QR en “Mis entradas”.',
  ],
  [
    '¿Puedo reservar una mesa?',
    'Sí. En el detalle del local o evento elige “Reservar mesa”, selecciona la zona, paga el depósito y recibe tu confirmación con QR.',
  ],
  [
    '¿Cómo funciona el ingreso con QR?',
    'Muestra el código QR de tu entrada o reserva en la puerta del local. Es único e intransferible.',
  ],
  [
    '¿Puedo cancelar una compra?',
    'Las cancelaciones dependen de la política de cada evento. Encuentra la opción en el detalle de tu entrada o reserva.',
  ],
  [
    '¿Por qué piden mi documento?',
    'UrNight es solo para mayores de 18 años. Validamos tu documento automáticamente por la seguridad de la comunidad.',
  ],
  [
    '¿Cómo afilio mi local?',
    'Ingresa a “Afiliar mi local”, completa los datos de tu negocio y nuestro equipo revisará tu solicitud.',
  ],
];

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <Reveal>
        <p className="un-eyebrow">Ayuda</p>
        <h1 className="mt-2 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
          Preguntas frecuentes
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          Resolvemos las dudas más comunes sobre cómo usar UrNight.
        </p>
      </Reveal>
      <div className="mt-10 space-y-3">
        {FAQS.map(([q, a], i) => (
          <Reveal key={q} delay={i * 50}>
            <details className="group rounded-md border bg-card transition-colors open:border-accent-border">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-semibold [&::-webkit-details-marker]:hidden">
                {q}
                <CaretDown className="size-4 shrink-0 text-lavender transition-transform group-open:rotate-180" />
              </summary>
              <p className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground">{a}</p>
            </details>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
