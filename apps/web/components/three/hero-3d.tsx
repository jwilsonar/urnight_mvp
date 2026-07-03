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
  const [inView, setInView] = useState(false);
  const [reduced, setReduced] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);

    const node = ref.current;
    let io: IntersectionObserver | undefined;
    if (node) {
      io = new IntersectionObserver(
        ([entry]) => {
          if (entry?.isIntersecting) {
            setInView(true);
            setMounted(true); // una vez montado, se queda; solo se pausa
          } else {
            setInView(false);
          }
        },
        { threshold: 0.15 },
      );
      io.observe(node);
    }
    return () => {
      mq.removeEventListener('change', onChange);
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
