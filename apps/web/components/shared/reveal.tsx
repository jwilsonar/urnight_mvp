'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { cn } from '@urnight/ui';

/**
 * Reveal on-scroll: aplica .un-reveal y agrega .is-visible cuando el bloque
 * entra al viewport (una sola vez). `delay` escalona cards de una grilla.
 * Con prefers-reduced-motion el CSS lo deja siempre visible.
 */
export function Reveal({
  children,
  delay = 0,
  depth = false,
  className,
}: {
  children: ReactNode;
  delay?: number;
  /** Entra con rotación en X (profundidad 3D) en vez del fade-up plano. */
  depth?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn(depth ? 'un-reveal-3d' : 'un-reveal', className)}
      style={delay ? ({ '--reveal-delay': `${delay}ms` } as React.CSSProperties) : undefined}
    >
      {children}
    </div>
  );
}
