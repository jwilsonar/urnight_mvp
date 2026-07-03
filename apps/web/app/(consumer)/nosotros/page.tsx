import type { Metadata } from 'next';
import { Reveal } from '@/components/shared/reveal';

export const metadata: Metadata = {
  title: 'Sobre nosotros',
  description:
    'UrNight nació en Lima para reunir en un solo lugar lo mejor de la noche: eventos, bares y discotecas verificados.',
};

/** Página informativa del prototipo (Sobre nosotros). Contenido estático. */
const SECTIONS: Array<[string, string]> = [
  [
    'Nuestra misión',
    'Hacer que salir sea simple y seguro. Queremos que descubras dónde ir, compres tu entrada sin reventa y armes el plan con tus amigos en segundos.',
  ],
  [
    'Qué hacemos',
    'Conectamos a los noctámbulos con locales verificados. Compra de entradas, reserva de mesas, listas y beneficios — todo dentro de una experiencia pensada para la noche.',
  ],
  [
    'Para los locales',
    'Damos a discotecas y bares herramientas para publicar eventos, gestionar su aforo, vender entradas y reservar mesas, llegando a miles de personas que buscan dónde salir.',
  ],
  [
    'Compromiso',
    'Plataforma solo para mayores de 18 años. Verificamos documentos, protegemos tus datos y combatimos la reventa para que vivas la noche con tranquilidad.',
  ],
];

export default function NosotrosPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <Reveal>
        <p className="un-eyebrow">Conócenos</p>
        <h1 className="mt-2 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
          Sobre nosotros
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          UrNight nació en Lima para reunir en un solo lugar lo mejor de la noche: eventos, bares y
          discotecas verificados.
        </p>
      </Reveal>
      <div className="mt-10 space-y-8">
        {SECTIONS.map(([title, body], i) => (
          <Reveal key={title} delay={i * 60}>
            <section>
              <h2 className="mb-2.5 font-heading text-xl font-bold">{title}</h2>
              <p className="leading-relaxed text-muted-foreground">{body}</p>
            </section>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
