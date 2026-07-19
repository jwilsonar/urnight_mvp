'use client';

/**
 * Variante 3D del lockup de marca (patrón .rv-logo3d del DS). Misma API que
 * <Logo/> para poder sustituirlo donde queramos.
 *
 * El "3D" es solo profundidad y luz: la marca vive en un plano por delante del
 * wordmark (translateZ 20px vs 8px, ya en el CSS) y al inclinar el desfase
 * entre ambos planos es lo que se lee como volumen.
 */

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { cn } from '@urnight/ui';

/** Grados máximos de inclinación. Igual que <Tilt/> para que el logo se
 *  incline en el mismo "dialecto" que las cards; más que esto y el lockup
 *  empieza a leerse como un juguete. */
const TILT_MAX = 7;

/** El barrido de entrada espera a que el wordmark termine de cambiar de fuente
 *  y el PNG de decodificar; a t=0 el destello se perdería. */
const SWEEP_ON_MOUNT_DELAY = 260;

export function Logo3D({ className, href = '/' }: { className?: string; href?: string }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const rafRef = useRef(0);
  const pointerRef = useRef({ x: 0, y: 0 });
  /** La MediaQueryList es viva (.matches se actualiza sola), así que la
   *  guardamos y evitamos un matchMedia por frame. */
  const reduceRef = useRef<MediaQueryList | null>(null);
  const [sweeping, setSweeping] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    reduceRef.current = mq;

    let timer = 0;
    if (!mq.matches) timer = window.setTimeout(() => setSweeping(true), SWEEP_ON_MOUNT_DELAY);

    return () => {
      if (timer) window.clearTimeout(timer);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  /** Lee el rect y escribe las variables dentro del rAF: un solo frame
   *  pendiente, sin setState por movimiento. */
  function flush() {
    rafRef.current = 0;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (pointerRef.current.x - rect.left) / rect.width;
    const py = (pointerRef.current.y - rect.top) / rect.height;
    el.style.setProperty('--logo-rx', `${((0.5 - py) * TILT_MAX).toFixed(2)}deg`);
    el.style.setProperty('--logo-ry', `${((px - 0.5) * TILT_MAX).toFixed(2)}deg`);
  }

  function handleMove(e: React.PointerEvent<HTMLAnchorElement>) {
    if (reduceRef.current?.matches) return;
    pointerRef.current = { x: e.clientX, y: e.clientY };
    if (!rafRef.current) rafRef.current = requestAnimationFrame(flush);
  }

  function handleLeave() {
    // Cancelamos el frame pendiente: si no, volvería a pintar la inclinación
    // justo después de haberla soltado.
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
    const el = ref.current;
    if (!el) return;
    el.style.setProperty('--logo-rx', '0deg');
    el.style.setProperty('--logo-ry', '0deg');
  }

  function triggerSweep() {
    if (reduceRef.current?.matches) return;
    setSweeping(true);
  }

  return (
    <Link
      ref={ref}
      href={href}
      aria-label="RAVENUE — inicio"
      data-sweep={sweeping ? 'true' : undefined}
      onPointerEnter={triggerSweep}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      onFocus={triggerSweep}
      className={cn('rv-logo3d inline-flex items-center gap-2.5', className)}
    >
      {/* inline-flex: el box de la marca tiene que calzar exactamente con el de
          la V; el barrido va con inset:0 y máscara `contain`. */}
      <span className="rv-logo3d__mark inline-flex">
        <svg
          aria-hidden="true"
          viewBox="0 0 36 36"
          className="h-9 w-9 shrink-0 text-primary"
          fill="none"
        >
          <path
            d="M5 6 16 29 27 6M27 6l6-4"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinecap="square"
            strokeLinejoin="miter"
          />
        </svg>
        {/* Al acabar soltamos el atributo para poder volver a disparar el barrido. */}
        <span
          aria-hidden="true"
          className="rv-logo3d__sweep"
          onAnimationEnd={() => setSweeping(false)}
        />
      </span>
      <span className="rv-logo3d__word font-display text-[19px] font-bold tracking-[0.16em] text-foreground">
        RA<span className="text-[var(--rv-rose)]">VE</span>NUE
      </span>
    </Link>
  );
}
