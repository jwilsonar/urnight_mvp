'use client';

/**
 * Inclinación 3D en perspectiva siguiendo el puntero. CSS puro + un handler
 * ligero que actualiza variables CSS (transform en GPU) — sin librerías, ~0 KB.
 * Respeta prefers-reduced-motion (no engancha handlers y el CSS deja transform
 * en none). Pensado para envolver cards clickeables.
 */

import { useRef, type ReactNode } from 'react';
import { cn } from '@urnight/ui';

export function Tilt({
  children,
  className,
  max = 7,
  glare = true,
}: {
  children: ReactNode;
  className?: string;
  /** Grados máximos de inclinación. */
  max?: number;
  /** Brillo especular que sigue al puntero. */
  glare?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  function handleMove(e: React.PointerEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    el.style.setProperty('--tilt-rx', `${((0.5 - py) * max).toFixed(2)}deg`);
    el.style.setProperty('--tilt-ry', `${((px - 0.5) * max).toFixed(2)}deg`);
    el.style.setProperty('--tilt-gx', `${(px * 100).toFixed(1)}%`);
    el.style.setProperty('--tilt-gy', `${(py * 100).toFixed(1)}%`);
  }

  function reset() {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty('--tilt-rx', '0deg');
    el.style.setProperty('--tilt-ry', '0deg');
  }

  return (
    <div
      ref={ref}
      onPointerMove={handleMove}
      onPointerLeave={reset}
      data-glare={glare ? '' : undefined}
      className={cn('rv-tilt', className)}
    >
      {children}
    </div>
  );
}
