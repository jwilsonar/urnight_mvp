import type { Metadata } from "next";
import Image from "next/image";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
} from "@urnight/ui";
import { LogoDirections } from "./logo-directions";

export const metadata: Metadata = { title: "Brand Lab" };

const PALETTE = [
  {
    name: "Obsidian",
    hex: "#0B0B0D",
    use: "Fondo base",
    swatch: "bg-[var(--rv-obsidian)]",
  },
  {
    name: "Charcoal Carbon",
    hex: "#1A1A1D",
    use: "Superficies",
    swatch: "bg-surface",
  },
  {
    name: "Elevated",
    hex: "#23222A",
    use: "Superficies elevadas",
    swatch: "bg-elevated",
  },
  {
    name: "Ravenue Crimson",
    hex: "#B21E45",
    use: "Acciones y marca",
    swatch: "bg-primary",
  },
  {
    name: "Deep Wine",
    hex: "#6E1833",
    use: "Pressed y degradados",
    swatch: "bg-[var(--rv-wine)]",
  },
  {
    name: "Moon White",
    hex: "#F4F0F2",
    use: "Texto primario",
    swatch: "bg-foreground",
  },
  {
    name: "Smoke Gray",
    hex: "#A8A4AE",
    use: "Texto secundario",
    swatch: "bg-[var(--rv-smoke)]",
  },
  {
    name: "Steel Border",
    hex: "#302E38",
    use: "Bordes",
    swatch: "bg-[var(--rv-steel)]",
  },
  {
    name: "Border Soft",
    hex: "#44414D",
    use: "Bordes fuertes y hover",
    swatch: "bg-[var(--rv-border-soft)]",
  },
] as const;

const MOTION = [
  { name: "Fast", value: "120ms", use: "Hover y press" },
  { name: "Normal", value: "220ms", use: "Paneles y modales" },
  { name: "Slow", value: "360ms", use: "Transiciones de página" },
] as const;

const MESSAGES = [
  {
    context: "Eslogan principal",
    messages: ["Donde la noche encuentra su lugar."],
  },
  { context: "Alternativa", messages: ["La noche, mejor conectada."] },
  {
    context: "B2C",
    messages: ["Encuentra dónde vibra la noche.", "Tu noche empieza aquí."],
  },
  {
    context: "B2B",
    messages: [
      "Turn venues into revenue.",
      "Más visibilidad. Más público. Más negocio.",
    ],
  },
] as const;

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-8 max-w-3xl">
      <p className="rv-eyebrow">{eyebrow}</p>
      <h2 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-3 leading-relaxed text-muted-foreground">
          {description}
        </p>
      ) : null}
    </div>
  );
}

export default function BrandLabPage() {
  return (
    <div className="bg-root">
      <section className="border-b bg-[image:var(--gradient-brand)]">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <p className="rv-eyebrow">Brand Lab — identidad final</p>
          <h1 className="sr-only">RAVENUE</h1>
          <Image
            src="/brand/lockup-horizontal.png"
            alt="RAVENUE"
            width={1292}
            height={252}
            priority
            className="mt-8 h-auto w-full max-w-3xl"
          />
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            Donde la noche encuentra su lugar.
          </p>
        </div>
      </section>

      <section
        className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
        aria-labelledby="logos-title"
      >
        <div id="logos-title">
          <SectionHeading
            eyebrow="01 — Sistema de logo"
            title="Identidad final"
            description="El wordmark y la V angular forman el sistema definitivo para los puntos de contacto de RAVENUE."
          />
        </div>
        <LogoDirections />
      </section>

      <section className="border-y bg-deep" aria-labelledby="palette-title">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div id="palette-title">
            <SectionHeading
              eyebrow="02 — Color"
              title="Obsidiana, luna y carmín"
              description="Una base nocturna sobria donde el carmín se reserva para marca y acción."
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PALETTE.map((color) => (
              <article
                key={color.name}
                className="overflow-hidden rounded-lg border bg-card"
              >
                <div
                  className={`h-32 border-b ${color.swatch}`}
                  aria-hidden="true"
                />
                <div className="p-4">
                  <h3 className="font-bold">{color.name}</h3>
                  <p className="mt-1 font-mono text-xs text-[var(--rv-rose)]">
                    {color.hex}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {color.use}
                  </p>
                </div>
              </article>
            ))}
          </div>
          <div className="mt-8 rounded-lg border bg-card p-5">
            <div className="flex items-center justify-between gap-4 text-sm">
              <strong>Regla de composición</strong>
              <span className="text-muted-foreground">70 / 20 / 10</span>
            </div>
            <div
              className="mt-4 flex h-5 overflow-hidden rounded-full"
              aria-label="70% oscuros, 20% blancos y grises, 10% carmín"
            >
              <span className="w-[70%] bg-[var(--rv-obsidian)]" />
              <span className="w-[20%] bg-foreground" />
              <span className="w-[10%] bg-primary" />
            </div>
          </div>
        </div>
      </section>

      <section
        className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
        aria-labelledby="type-title"
      >
        <div id="type-title">
          <SectionHeading
            eyebrow="03 — Tipografía"
            title="Sora para atraer. Inter para orientar."
          />
        </div>
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="p-6 sm:p-8">
            <p className="font-display text-4xl font-bold leading-tight sm:text-6xl">
              La noche encuentra su lugar.
            </p>
            <p className="mt-5 text-sm text-muted-foreground">
              Sora 700 · titulares, campañas y momentos de marca.
            </p>
          </Card>
          <Card className="p-6 sm:p-8">
            <p className="text-lg leading-relaxed">
              Descubre eventos, locales y experiencias con una interfaz clara
              incluso cuando la noche apenas comienza.
            </p>
            <div className="mt-6 overflow-hidden rounded-md border text-sm">
              <div className="grid grid-cols-2 border-b bg-surface px-4 py-3 font-bold">
                <span>Escala</span>
                <span>Uso</span>
              </div>
              <div className="grid grid-cols-2 px-4 py-3 text-muted-foreground">
                <span>Inter 14–16</span>
                <span>UI y lectura</span>
              </div>
            </div>
            <p className="mt-5 text-sm text-muted-foreground">
              Inter 400–700 · navegación, datos, formularios y cuerpo.
            </p>
          </Card>
        </div>
      </section>

      <section className="border-y bg-deep" aria-labelledby="components-title">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div id="components-title">
            <SectionHeading
              eyebrow="04 — Componentes"
              title="Tokens sobre producto real"
              description="Estados del design system renderizados con la nueva paleta."
            />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="p-6">
              <h3 className="font-heading text-lg font-bold">
                Acciones y estados
              </h3>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Button>Default</Button>
                <Button className="bg-primary-hover">Hover</Button>
                <Button disabled>Disabled</Button>
                <Button variant="secondary">Secundaria</Button>
                <Badge>RAVENUE Select</Badge>
              </div>
              <div className="mt-7">
                <label
                  htmlFor="brand-lab-email"
                  className="mb-2 block text-sm font-bold"
                >
                  Correo de invitación
                </label>
                <Input
                  id="brand-lab-email"
                  type="email"
                  placeholder="socio@ravenue.pe"
                />
              </div>
            </Card>
            <Card>
              <CardHeader>
                <Badge className="w-fit">Esta noche</Badge>
                <CardTitle className="pt-3">Sesión RAVENUE</CardTitle>
                <CardDescription>
                  Una tarjeta real para validar superficie, borde y jerarquía.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border bg-surface p-4">
                  <p className="font-bold">Centro de Lima · 11:30 p. m.</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Acceso verificado y cupos limitados.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section
        className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
        aria-labelledby="contrast-title"
      >
        <div id="contrast-title">
          <SectionHeading
            eyebrow="05 — Semántica"
            title="Carmín de marca no es error"
          />
        </div>
        <div className="grid overflow-hidden rounded-lg border sm:grid-cols-2">
          <div className="bg-primary p-8 text-primary-foreground">
            <p className="font-display text-2xl font-bold">Ravenue Crimson</p>
            <p className="mt-2 font-mono text-sm">--primary · #B21E45</p>
          </div>
          <div className="bg-error p-8 text-white">
            <p className="font-display text-2xl font-bold">Error</p>
            <p className="mt-2 font-mono text-sm">--error · #EF4444</p>
          </div>
        </div>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          La acción de marca usa un carmín frío y profundo. El estado de error
          conserva un rojo brillante para distinguir intención de marca y alerta
          funcional.
        </p>
      </section>

      <section className="border-y bg-deep" aria-labelledby="messages-title">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div id="messages-title">
            <SectionHeading eyebrow="06 — Voz" title="Mensajes candidatos" />
          </div>
          <div className="overflow-x-auto rounded-lg border bg-card">
            <table className="w-full min-w-2xl border-collapse text-left text-sm">
              <thead className="bg-surface text-foreground">
                <tr>
                  <th scope="col" className="px-5 py-4 font-bold">
                    Contexto
                  </th>
                  <th scope="col" className="px-5 py-4 font-bold">
                    Mensajes
                  </th>
                </tr>
              </thead>
              <tbody>
                {MESSAGES.map((row) => (
                  <tr key={row.context} className="border-t">
                    <th
                      scope="row"
                      className="px-5 py-4 align-top font-bold text-[var(--rv-rose)]"
                    >
                      {row.context}
                    </th>
                    <td className="px-5 py-4 text-muted-foreground">
                      {row.messages.join(" / ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section
        className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
        aria-labelledby="gradient-title"
      >
        <div id="gradient-title">
          <SectionHeading
            eyebrow="07 — Atmósfera"
            title="Gradiente institucional"
          />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border bg-[image:var(--gradient-brand)] p-8 sm:p-12">
            <p className="max-w-xl font-display text-3xl font-bold sm:text-4xl">
              Profundidad nocturna sin perder claridad.
            </p>
            <code className="mt-8 block overflow-x-auto rounded-md border bg-root/80 p-4 text-xs text-[var(--rv-rose)]">
              --gradient-brand: linear-gradient(135deg, #0B0B0D 0%, #1A1A1D 55%,
              #6E1833 100%);
            </code>
          </div>
          <div className="rounded-xl border bg-[image:var(--gradient-luxury)] p-8 sm:p-12">
            <p className="max-w-xl font-display text-3xl font-bold sm:text-4xl">
              Luxury
            </p>
            <code className="mt-8 block overflow-x-auto rounded-md border bg-root/80 p-4 text-xs text-[var(--rv-rose)]">
              --gradient-luxury: linear-gradient(90deg, #0B0B0D 0%, #6E1833
              100%);
            </code>
          </div>
        </div>
      </section>

      <section className="border-t bg-deep" aria-labelledby="motion-title">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div id="motion-title">
            <SectionHeading
              eyebrow="08 — Motion"
              title="Rápido, claro y controlado"
              description="Duraciones canónicas para feedback, transiciones de componentes y cambios de página."
            />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {MOTION.map((token) => (
              <Card key={token.name} className="p-6">
                <p className="rv-eyebrow">{token.name}</p>
                <p className="mt-3 font-mono text-2xl font-medium text-foreground">
                  {token.value}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {token.use}
                </p>
              </Card>
            ))}
          </div>
          <div className="mt-4 grid gap-4 font-mono text-sm text-muted-foreground lg:grid-cols-2">
            <code className="rounded-md border bg-card p-4">
              standard · cubic-bezier(0.4, 0, 0.2, 1)
            </code>
            <code className="rounded-md border bg-card p-4">
              out · cubic-bezier(0, 0, 0.2, 1)
            </code>
          </div>
        </div>
      </section>
    </div>
  );
}
