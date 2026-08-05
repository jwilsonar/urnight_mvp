'use client';

import { m } from 'framer-motion';
import type { ReactNode } from 'react';

/**
 * Cinta infinita decorativa. Renderiza `copies` copias idénticas del contenido
 * y desplaza exactamente 1/copies del ancho total: al cerrar el ciclo, la copia
 * siguiente cae en el mismo píxel y el loop no se nota.
 *
 * Dos detalles que evitan el "hueco en blanco" que tenía la versión anterior:
 * - El espaciado entre copias vive DENTRO de cada unidad (pr-4), no como `gap`
 *   del flex: un gap externo no entra en la cuenta del % y desalinea el loop.
 * - Con 6 copias, durante todo el ciclo quedan ≥5 copias en la cinta: cubre de
 *   sobra cualquier viewport sin que asome el final.
 *
 * `aria-hidden`: es textura de marca, no contenido — los lectores de pantalla
 * no tienen que oír la lista de distritos en bucle.
 */
export function Marquee({
  children,
  speed = 40,
  copies = 6,
}: {
  children: ReactNode;
  /** Segundos que tarda una copia en recorrer su propio ancho. */
  speed?: number;
  copies?: number;
}) {
  return (
    <div
      aria-hidden
      className="overflow-hidden"
      style={{
        maskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
        WebkitMaskImage:
          'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
      }}
    >
      <m.div
        className="flex w-max"
        animate={{ x: ['0%', `-${(100 / copies).toFixed(4)}%`] }}
        transition={{ duration: speed, ease: 'linear', repeat: Infinity }}
      >
        {Array.from({ length: copies }, (_, i) => (
          <div key={i} className="flex shrink-0 items-center pr-4">
            {children}
          </div>
        ))}
      </m.div>
    </div>
  );
}
