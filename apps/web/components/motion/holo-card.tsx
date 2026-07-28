'use client';

/**
 * Ticket holográfico: la card se inclina bajo el puntero y el foil difracta
 * según esa inclinación.
 *
 * Todo el aspecto vive en `.rv-holo*` (globals.css); aquí solo alimentamos sus
 * variables CSS. Nunca con setState por frame: multiplicado por una grilla de
 * cards se comería el scroll.
 */

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent,
  type ReactNode,
} from 'react';
import { cn } from '@urnight/ui';

/**
 * El foil recorre ~1.8x lo que el brillo. Un reflejo especular sigue al puntero
 * 1:1; una lámina difractiva no — ese desfase entre ambos es justo lo que el ojo
 * lee como "holograma" y no como "un gradiente que se mueve".
 */
const FOIL_GAIN = 1.8;

/**
 * `true` mientras el usuario no pida menos movimiento. Arranca en `false` para
 * que el servidor y el primer render del cliente coincidan (matchMedia no existe
 * en SSR); los handlers no viajan en el HTML, así que engancharlos después del
 * mount no provoca mismatch de hidratación.
 */
function useMotionOk(): boolean {
  const [ok, setOk] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setOk(!mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  return ok;
}

export function HoloCard({
  children,
  max = 10,
  className,
}: {
  children: ReactNode;
  /** Grados máximos de inclinación por eje. El rango real es -max..+max. */
  max?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const frame = useRef(0);
  const point = useRef({ x: 0, y: 0 });
  const motionOk = useMotionOk();

  const paint = useCallback(() => {
    frame.current = 0;
    const el = ref.current;
    if (!el) return;
    // Leemos layout aquí (dentro del rAF y antes de escribir) para no thrashear.
    const rect = el.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const px = (point.current.x - rect.left) / rect.width;
    const py = (point.current.y - rect.top) / rect.height;

    // Eje X invertido: el borde donde está el puntero es el que se hunde, como
    // si lo estuvieras empujando. Sin la inversión la card "huye" del cursor.
    el.style.setProperty('--holo-rx', `${((0.5 - py) * 2 * max).toFixed(2)}deg`);
    el.style.setProperty('--holo-ry', `${((px - 0.5) * 2 * max).toFixed(2)}deg`);
    // Brillo especular: 1:1 con el puntero.
    el.style.setProperty('--holo-gx', `${(px * 100).toFixed(1)}%`);
    el.style.setProperty('--holo-gy', `${(py * 100).toFixed(1)}%`);
    // Foil: mismo centro, más recorrido. Puede salirse de 0..100%, es válido en
    // background-position y es justo lo que hace que las bandas "barran".
    el.style.setProperty('--holo-bx', `${(50 + (px - 0.5) * 100 * FOIL_GAIN).toFixed(1)}%`);
    el.style.setProperty('--holo-by', `${(50 + (py - 0.5) * 100 * FOIL_GAIN).toFixed(1)}%`);
  }, [max]);

  const handleMove = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      // Solo puntero fino: en touch, mover el dedo es scrollear, no inclinar.
      if (e.pointerType !== 'mouse') return;
      point.current = { x: e.clientX, y: e.clientY };
      if (!frame.current) frame.current = requestAnimationFrame(paint);
    },
    [paint],
  );

  const handleEnter = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      if (e.pointerType !== 'mouse') return;
      const el = ref.current;
      if (!el) return;
      el.dataset.active = 'true';
      el.style.setProperty('--holo-foil-op', '0.55');
      el.style.setProperty('--holo-shine-op', '1');
      el.style.setProperty('--holo-scale', '1.02');
      handleMove(e);
    },
    [handleMove],
  );

  const handleLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    if (frame.current) {
      cancelAnimationFrame(frame.current);
      frame.current = 0;
    }
    delete el.dataset.active;
    el.style.setProperty('--holo-rx', '0deg');
    el.style.setProperty('--holo-ry', '0deg');
    el.style.setProperty('--holo-scale', '1');
    el.style.setProperty('--holo-foil-op', '0');
    el.style.setProperty('--holo-shine-op', '0');
  }, []);

  useEffect(() => {
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={cn('rv-holo rounded-lg', className)}
      onPointerEnter={motionOk ? handleEnter : undefined}
      onPointerMove={motionOk ? handleMove : undefined}
      onPointerLeave={motionOk ? handleLeave : undefined}
      onPointerCancel={motionOk ? handleLeave : undefined}
    >
      {/* `relative` ancla el foil/shine (inset:0) y `rounded-lg` es de donde
          heredan su border-radius. */}
      <div className="relative h-full rounded-lg">
        {children}
        <span className="rv-holo__foil" aria-hidden="true" />
        <span className="rv-holo__shine" aria-hidden="true" />
      </div>
    </div>
  );
}
