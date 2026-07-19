import { Badge, Card } from '@urnight/ui';

function SharedVeLockup() {
  return (
    <svg aria-hidden="true" viewBox="0 0 440 120" className="h-28 w-full" fill="none">
      <path
        d="M18 27 43 88 68 27M68 27l13-8"
        className="text-primary"
        stroke="currentColor"
        strokeWidth="7"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
      <text
        x="108"
        y="76"
        className="text-foreground"
        fill="currentColor"
        fontFamily="var(--font-sora)"
        fontSize="40"
        fontWeight="700"
        letterSpacing="7"
      >
        RA
      </text>
      <text
        x="177"
        y="76"
        className="text-[var(--rv-rose)]"
        fill="currentColor"
        fontFamily="var(--font-sora)"
        fontSize="40"
        fontWeight="700"
        letterSpacing="7"
      >
        VE
      </text>
      <text
        x="249"
        y="76"
        className="text-foreground"
        fill="currentColor"
        fontFamily="var(--font-sora)"
        fontSize="40"
        fontWeight="700"
        letterSpacing="7"
      >
        NUE
      </text>
    </svg>
  );
}

function RavenPin() {
  return (
    <svg aria-hidden="true" viewBox="0 0 220 150" className="h-28 w-full text-primary">
      <defs>
        <mask id="raven-pin-cutout">
          <rect width="220" height="150" fill="white" />
          <path d="m76 57 30-17 30 7-17 13 23 13-34-5-16 17-1-20-18 6Z" fill="black" />
        </mask>
      </defs>
      <path
        d="M110 12c-37 0-64 25-64 59 0 43 64 72 64 72s64-29 64-72c0-34-27-59-64-59Z"
        fill="currentColor"
        mask="url(#raven-pin-cutout)"
      />
    </svg>
  );
}

function RavenueMonogram() {
  return (
    <svg aria-hidden="true" viewBox="0 0 220 150" className="h-28 w-full" fill="none">
      <text
        x="38"
        y="112"
        className="text-foreground"
        fill="currentColor"
        fontFamily="var(--font-sora)"
        fontSize="92"
        fontWeight="800"
      >
        R
      </text>
      <path
        d="m109 48 34 66 32-66m-1 1 21-15-13 25 25-4"
        className="text-primary"
        stroke="currentColor"
        strokeWidth="9"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
    </svg>
  );
}

const DIRECTIONS = [
  {
    key: 'd1',
    title: 'D1 — Wordmark “VE compartido”',
    description: 'V intervenida como entrada, haz de luz y ala.',
    pros: 'Moderna, escalable y comunica RAVE + VENUE.',
    cons: 'Requiere trabajo tipográfico fino.',
    visual: <SharedVeLockup />,
    recommended: true,
  },
  {
    key: 'd2',
    title: 'D2 — Cuervo en espacio negativo',
    description: 'Cabeza geométrica dentro de un pin de ubicación.',
    pros: 'Conecta con descubrimiento y ubicación.',
    cons: 'Riesgo de parecer gaming o ciberseguridad.',
    visual: <RavenPin />,
    recommended: false,
  },
  {
    key: 'd3',
    title: 'D3 — Monograma RV',
    description: 'La diagonal de la V se convierte en ala.',
    pros: 'Premium; ideal para favicon, avatar y pulseras.',
    cons: 'No explica RAVE + VENUE por sí solo.',
    visual: <RavenueMonogram />,
    recommended: false,
  },
] as const;

/** Comparativa visual de las tres rutas evaluadas para el sistema de marca. */
export function LogoDirections() {
  return (
    <>
      <div className="grid gap-4 lg:grid-cols-3">
        {DIRECTIONS.map((direction) => (
          <Card key={direction.key} className="flex h-full flex-col overflow-hidden">
            <div className="flex min-h-44 items-center border-b bg-surface px-5 py-6">
              {direction.visual}
            </div>
            <div className="flex flex-1 flex-col p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h3 className="font-heading text-lg font-bold">{direction.title}</h3>
                {direction.recommended ? <Badge>Recomendada</Badge> : null}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{direction.description}</p>
              <dl className="mt-6 space-y-3 text-sm">
                <div>
                  <dt className="font-bold text-foreground">Pros</dt>
                  <dd className="mt-1 text-muted-foreground">{direction.pros}</dd>
                </div>
                <div>
                  <dt className="font-bold text-foreground">Contras</dt>
                  <dd className="mt-1 text-muted-foreground">{direction.cons}</dd>
                </div>
              </dl>
            </div>
          </Card>
        ))}
      </div>
      <p className="mt-5 rounded-md border border-accent-border bg-accent px-4 py-3 text-sm text-muted-foreground">
        <strong className="text-[var(--rv-rose)]">Recomendación:</strong> D1 como logo principal y D3 como ícono
        reducido o avatar. D2 queda descartada como identidad principal.
      </p>
    </>
  );
}
