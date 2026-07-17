import {
  Buildings,
  ShieldCheck,
  Target,
  UsersThree,
} from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import { Card } from "@urnight/ui";
import { Reveal } from "@/components/shared/reveal";

export const metadata: Metadata = {
  title: "Sobre nosotros",
  description:
    "UrNight nació en Lima para reunir en un solo lugar lo mejor de la noche: eventos, bares y discotecas verificados.",
};

const STATS = [
  { value: "320+", label: "Eventos este mes" },
  { value: "85", label: "Locales verificados" },
  { value: "12k", label: "Noctámbulos felices" },
] as const;

/** Historia de UrNight: el texto original se conserva y cambia su jerarquía visual. */
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
      <section className="un-hero-glow border-b">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <Reveal>
            <p className="un-eyebrow">Conócenos</p>
            <h1 className="mt-3 max-w-4xl font-display text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              La noche se vive mejor cuando todo fluye
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              UrNight nació en Lima para reunir en un solo lugar lo mejor de la
              noche: eventos, bares y discotecas verificados.
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
      </section>

      <section
        className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
        aria-labelledby="nuestra-historia"
      >
        <Reveal>
          <p className="un-eyebrow">Nuestra historia</p>
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
              <Reveal key={section.title} delay={index * 60} className="h-full">
                <Card className="h-full p-6">
                  <span className="flex size-11 items-center justify-center rounded-md border border-accent-border bg-accent text-lavender">
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
