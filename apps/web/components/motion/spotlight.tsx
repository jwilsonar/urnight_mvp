'use client';

/**
 * Luz de club que sigue al puntero. Consume el contrato .un-spotlight de
 * globals.css (--spot-x/--spot-y en %, --spot-op 0..1, --spot-size en px): el
 * gradiente vive detrás del contenido, aquí solo movemos la lámpara.
 *
 * Patrón del repo: rAF coalescido + style.setProperty, cero setState por frame
 * (ver parallax.tsx). --spot-op es discreto — lo escribimos al entrar y al
 * salir, el fundido de 500ms lo hace el CSS.
 */

import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import { cn } from '@urnight/ui';

export function Spotlight({
  children,
  className,
  size = 600,
  intensity = 1,
}: {
  children: ReactNode;
  className?: string;
  /** Radio del foco en px: radial-gradient lee un <length> como radio, no diámetro. */
  size?: number;
  /** Techo de --spot-op (0..1). Bájalo en zonas con mucho texto. */
  intensity?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const op = Math.min(Math.max(intensity, 0), 1);

  useEffect(() => {
    // El CSS ya esconde el ::before con reduced-motion: ni enganchamos.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const el = ref.current;
    if (!el) return;

    // Touch: no hay puntero que seguir. En vez de apagar la luz (dejaría el
    // móvil plano sin motivo), la clavamos arriba al centro como un foco de
    // techo y salimos: tres escrituras y ni un listener. Más suave porque una
    // luz fija a tope se lee como mancha, no como ambiente.
    if (window.matchMedia('(pointer: coarse)').matches) {
      el.style.setProperty('--spot-x', '50%');
      el.style.setProperty('--spot-y', '0%');
      el.style.setProperty('--spot-op', (op * 0.6).toFixed(2));
      return;
    }

    let raf = 0;
    let cx = 0;
    let cy = 0;

    // La lectura del rect va aquí dentro, no en el handler: pointermove puede
    // disparar varias veces por frame y así el layout se lee una sola vez.
    const update = () => {
      raf = 0;
      const rect = el.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      el.style.setProperty('--spot-x', `${(((cx - rect.left) / rect.width) * 100).toFixed(1)}%`);
      el.style.setProperty('--spot-y', `${(((cy - rect.top) / rect.height) * 100).toFixed(1)}%`);
    };

    const onMove = (e: PointerEvent) => {
      cx = e.clientX;
      cy = e.clientY;
      if (!raf) raf = requestAnimationFrame(update);
    };
    const onEnter = (e: PointerEvent) => {
      onMove(e);
      el.style.setProperty('--spot-op', op.toFixed(2));
    };
    const onLeave = () => {
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
      el.style.setProperty('--spot-op', '0');
    };

    el.addEventListener('pointerenter', onEnter);
    el.addEventListener('pointermove', onMove, { passive: true });
    el.addEventListener('pointerleave', onLeave);
    return () => {
      el.removeEventListener('pointerenter', onEnter);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [op]);

  return (
    <div
      ref={ref}
      className={cn('un-spotlight', className)}
      style={{ '--spot-size': `${size}px` } as CSSProperties}
    >
      {children}
    </div>
  );
}
