'use client';

/**
 * Parallax por scroll: desplaza el elemento en Y a distinta velocidad que el
 * scroll, creando profundidad entre capas. Vanilla + rAF + variable CSS
 * (transform en GPU) — sin librerías. Respeta prefers-reduced-motion.
 */

import { useEffect, useRef, type ReactNode } from 'react';
import { cn } from '@urnight/ui';

export function Parallax({
  children,
  speed = 0.15,
  className,
}: {
  children: ReactNode;
  /** Positivo = más lento que el scroll (fondo); negativo = más rápido (frente). */
  speed?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const node = ref.current;
    if (!node) return;

    let raf = 0;
    const update = () => {
      raf = 0;
      const rect = node.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      // Desfase relativo al centro del viewport (-1..1) → px según velocidad.
      const fromCenter = (rect.top + rect.height / 2 - vh / 2) / vh;
      node.style.setProperty('--parallax-y', `${(fromCenter * speed * -100).toFixed(1)}px`);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [speed]);

  return (
    <div ref={ref} className={cn('un-parallax', className)}>
      {children}
    </div>
  );
}
