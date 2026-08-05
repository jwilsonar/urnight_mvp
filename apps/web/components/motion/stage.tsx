/**
 * Escenario 3D: abre un espacio con profundidad para sus hijos.
 *
 * Es lo que hace que el `translateZ` de un descendiente se vea: sin un ancestro
 * con `perspective`, un translateZ(48px) no cambia nada en pantalla. A
 * diferencia de Tilt (que aplica su propia perspectiva por elemento), aquí
 * todos los hijos comparten punto de fuga, así una grilla de cards se lee como
 * un mismo plano y no como piezas sueltas.
 *
 * Server component: solo emite el contenedor, no manda JS al cliente.
 */

import type { CSSProperties, ReactNode } from 'react';
import { cn } from '@urnight/ui';

export function Stage({
  children,
  className,
  perspective = 1200,
  origin = '50% 50%',
}: {
  children: ReactNode;
  className?: string;
  /** Distancia de la cámara en px. Menos = deformación más agresiva. */
  perspective?: number;
  /** Punto de fuga, sintaxis de `perspective-origin`. */
  origin?: string;
}) {
  return (
    <div
      className={cn('rv-stage', className)}
      style={
        {
          '--stage-persp': `${perspective}px`,
          '--stage-origin': origin,
        } as CSSProperties
      }
    >
      {children}
    </div>
  );
}
