'use client';

/**
 * Wrapper sostenible del centerpiece 3D del hero. Garantiza que el peso de
 * three.js/R3F NO entre al bundle inicial y que la experiencia degrade bien:
 *
 * - `dynamic(..., { ssr: false })`: el chunk 3D se descarga aparte y solo en cliente.
 * - IntersectionObserver: la escena se MONTA cuando el hero entra a viewport, y se
 *   pausa (sin desmontar) cuando sale, para no gastar GPU en scroll.
 * - prefers-reduced-motion o WebGL no disponible → se queda el fallback estático
 *   (la copa de marca en PNG con glow), nunca una pantalla vacía.
 */

import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

const HeroGoblet = dynamic(() => import('./hero-goblet').then((m) => m.HeroGoblet), {
  ssr: false,
});

/** Copa de marca estática con glow — se usa como fallback y como póster de carga. */
function GobletFallback() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="relative">
        <div
          aria-hidden
          className="un-breathe absolute inset-0 -z-10 rounded-full bg-[radial-gradient(circle,var(--accent-soft-strong),transparent_65%)] blur-2xl"
        />
        <Image
          src="/brand/urnight-mark.png"
          alt=""
          width={140}
          height={230}
          unoptimized
          className="h-auto w-28 opacity-90 drop-shadow-[0_0_40px_rgba(108,77,255,0.5)] sm:w-36"
        />
      </div>
    </div>
  );
}

export function Hero3D({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  // Arranca en true (el hero está sobre el pliegue); el IO lo corrige al salir.
  const [inView, setInView] = useState(true);
  const [reduced, setReduced] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);

    // Montaje robusto: el hero está siempre sobre el pliegue, así que cargamos
    // la escena tras el paint (requestIdleCallback → fallback a timeout) sin
    // depender de que el IntersectionObserver dispare. Sigue siendo lazy: el
    // chunk de three.js se descarga después del primer render.
    const ric =
      window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 200));
    const cic = window.cancelIdleCallback ?? window.clearTimeout;
    const idle = ric(() => setMounted(true));

    // El IntersectionObserver solo controla la pausa (inView) cuando el hero
    // sale de vista al hacer scroll; ya no gobierna el montaje.
    const node = ref.current;
    let io: IntersectionObserver | undefined;
    if (node) {
      io = new IntersectionObserver(([entry]) => setInView(Boolean(entry?.isIntersecting)), {
        threshold: 0.15,
      });
      io.observe(node);
    }
    return () => {
      mq.removeEventListener('change', onChange);
      cic(idle as number);
      io?.disconnect();
    };
  }, []);

  const show3D = mounted && !reduced;

  return (
    <div ref={ref} className={className} aria-hidden>
      {show3D ? <HeroGoblet paused={!inView} /> : <GobletFallback />}
    </div>
  );
}
