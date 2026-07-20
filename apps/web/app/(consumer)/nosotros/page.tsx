import {
  Buildings,
  ShieldCheck,
  Target,
  UsersThree,
} from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Image from "next/image";
import type { CSSProperties } from "react";
import { Card } from "@urnight/ui";
import { Reveal } from "@/components/shared/reveal";

export const metadata: Metadata = {
  title: "Sobre nosotros",
  description:
    "RAVENUE nació en Lima para reunir en un solo lugar lo mejor de la noche: eventos, bares y discotecas verificados.",
};

const STATS = [
  { value: "320+", label: "Eventos este mes" },
  { value: "85", label: "Locales verificados" },
  { value: "12k", label: "Noctámbulos felices" },
] as const;

/** Historia de RAVENUE: el texto original se conserva y cambia su jerarquía visual. */
const SECTIONS = [
  {
    icon: Target,
    title: "Nuestra misión",
    body: "Hacer que salir sea simple y seguro. Queremos que descubras dónde ir, compres tu entrada sin reventa y armes el plan con tus amigos en segundos.",
  },
  {
    icon: UsersThree,
    title: "Qué hacemos",
    body: "Conectamos a los noctámbulos con locales verificados. Compra de entradas, reserva de mesas, listas y beneficios — todo dentro de una experiencia pensada para la noche.",
  },
  {
    icon: Buildings,
    title: "Para los locales",
    body: "Damos a discotecas y bares herramientas para publicar eventos, gestionar su aforo, vender entradas y reservar mesas, llegando a miles de personas que buscan dónde salir.",
  },
  {
    icon: ShieldCheck,
    title: "Compromiso",
    body: "Plataforma solo para mayores de 18 años. Verificamos documentos, protegemos tus datos y combatimos la reventa para que vivas la noche con tranquilidad.",
  },
] as const;

export default function NosotrosPage() {
  return (
    <div>
      <section className="rv-hero-glow border-b">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
          <div>
            <Reveal>
              <p className="rv-eyebrow">Conócenos</p>
              <h1 className="mt-3 max-w-4xl font-display text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
                La noche se vive mejor cuando todo fluye
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                RAVENUE nació en Lima para reunir en un solo lugar lo mejor de
                la noche: eventos, bares y discotecas verificados.
              </p>
            </Reveal>

            <Reveal delay={120}>
              <dl className="mt-14 flex flex-wrap gap-x-12 gap-y-6 text-sm text-muted-foreground">
                {STATS.map((stat) => (
                  <div key={stat.label}>
                    <dd className="font-heading text-3xl font-extrabold text-foreground">
                      {stat.value}
                    </dd>
                    <dt>{stat.label}</dt>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>

          <div
            aria-hidden
            className="pointer-events-none relative min-h-80 overflow-hidden lg:min-h-[440px]"
          >
            <div className="absolute inset-12 rounded-full bg-primary/10 blur-3xl" />
            <Image
              src="/brand/icon-mark.png"
              alt=""
              width={632}
              height={622}
              className="absolute left-1/2 top-1/2 w-full max-w-[420px] -translate-x-1/2 -translate-y-1/2 -rotate-6 opacity-10"
            />
            <div
              className="rv-float absolute right-[8%] top-[8%] h-48 w-36 rounded-xl border border-accent-border bg-[linear-gradient(150deg,var(--rv-wine),var(--bg-card))] p-4 shadow-glow"
              style={
                {
                  "--drift-rot": "7deg",
                  "--drift-y": "-14px",
                  "--drift-dur": "8s",
                } as CSSProperties
              }
            >
              <div className="h-2 w-16 rounded-full bg-white/20" />
              <div className="mt-3 h-24 rounded-lg bg-[linear-gradient(145deg,var(--accent-soft-strong),transparent)]" />
              <div className="mt-3 h-2 w-20 rounded-full bg-white/10" />
            </div>
            <div
              className="rv-float absolute bottom-[5%] left-[6%] h-44 w-32 rounded-xl border border-accent-border bg-[linear-gradient(155deg,var(--bg-elevated),var(--rv-wine))] p-4 shadow-float"
              style={
                {
                  "--drift-rot": "-9deg",
                  "--drift-y": "12px",
                  "--drift-dur": "10s",
                } as CSSProperties
              }
            >
              <div className="h-20 rounded-lg border border-white/10 bg-primary/15" />
              <div className="mt-4 h-2 w-16 rounded-full bg-white/20" />
              <div className="mt-2 h-2 w-10 rounded-full bg-white/10" />
            </div>
            <div
              className="rv-float absolute bottom-[12%] right-[18%] h-36 w-28 rounded-xl border border-white/10 bg-[linear-gradient(145deg,var(--rv-crimson),var(--rv-wine))] p-3 opacity-80 shadow-glow"
              style={
                {
                  "--drift-rot": "4deg",
                  "--drift-y": "10px",
                  "--drift-dur": "7s",
                } as CSSProperties
              }
            >
              <div className="h-16 rounded-md bg-black/20" />
              <div className="mt-3 h-2 w-14 rounded-full bg-white/25" />
            </div>
          </div>
        </div>
      </section>

      <section
        className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
        aria-labelledby="nuestra-historia"
      >
        <Reveal>
          <p className="rv-eyebrow">Nuestra historia</p>
          <h2
            id="nuestra-historia"
            className="mt-2 font-heading text-3xl font-extrabold sm:text-4xl"
          >
            Lo que nos mueve
          </h2>
        </Reveal>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {SECTIONS.map((section, index) => {
            const Icon = section.icon;
            return (
              <Reveal key={section.title} delay={index * 80} className="h-full">
                <Card className="h-full p-6 transition-[transform,border-color] duration-200 hover:-translate-y-0.5 hover:border-[var(--rv-border-soft)] motion-reduce:transform-none">
                  <span className="flex size-11 items-center justify-center rounded-md border border-accent-border bg-accent text-rose">
                    <Icon className="size-5" weight="duotone" aria-hidden />
                  </span>
                  <h3 className="mt-4 font-heading text-xl font-bold">
                    {section.title}
                  </h3>
                  <p className="mt-2 leading-relaxed text-muted-foreground">
                    {section.body}
                  </p>
                </Card>
              </Reveal>
            );
          })}
        </div>
      </section>
    </div>
  );
}
