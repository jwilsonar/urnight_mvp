'use client';

/**
 * Ticket holográfico: la card se inclina bajo el puntero, el foil difracta según
 * esa inclinación y (opcional) se voltea para enseñar el reverso.
 *
 * Todo el aspecto vive en `.un-holo*` (globals.css); aquí solo alimentamos sus
 * variables CSS. Nunca con setState: un re-render por frame multiplicado por una
 * grilla de cards se come el scroll. El estado de React es solo `flipped`, que es
 * discreto.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
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

const LABELS = { toBack: 'Ver el reverso del ticket', toFront: 'Volver al frente del ticket' };

type FlipApi = { flipped: boolean; toggle: () => void };
const FlipContext = createContext<FlipApi | null>(null);

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
  back,
  max = 10,
  className,
  trigger = 'card',
  flipLabels = LABELS,
}: {
  /** Cara frontal. */
  children: ReactNode;
  /** Cara trasera. Si viene, se habilita el flip. */
  back?: ReactNode;
  /** Grados máximos de inclinación por eje. El rango real es -max..+max. */
  max?: number;
  className?: string;
  /**
   * Quién dispara el flip:
   * - `card`: la card entera es el botón. Solo válido si su contenido NO es
   *   interactivo — un `role="button"` no puede contener links ni botones.
   * - `slot`: lo dispara un `<HoloFlipButton>` que renderiza el consumidor.
   */
  trigger?: 'card' | 'slot';
  /** aria-label de la card en modo `trigger="card"`. */
  flipLabels?: { toBack: string; toFront: string };
}) {
  const ref = useRef<HTMLDivElement>(null);
  const flipRef = useRef<HTMLDivElement>(null);
  const frame = useRef(0);
  const point = useRef({ x: 0, y: 0 });
  const userFlipped = useRef(false);
  const motionOk = useMotionOk();
  const [flipped, setFlipped] = useState(false);

  const canFlip = back != null;
  /** La card entera actúa de botón solo si nadie más va a disparar el flip. */
  const cardIsTrigger = canFlip && trigger === 'card';

  const toggle = useCallback(() => {
    userFlipped.current = true;
    setFlipped((v) => !v);
  }, []);

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

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault(); // Espacio scrollearía la página.
      toggle();
    },
    [toggle],
  );

  useEffect(() => {
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, []);

  /**
   * Rescata el foco tras voltear. `inert` desenfoca lo que contiene, así que en
   * modo `slot` el propio botón que disparó el flip se queda inerte y el foco
   * cae al `<body>`: el usuario de teclado tendría que volver a tabular desde el
   * principio del documento para llegar al reverso (WCAG 2.4.3).
   *
   * Solo actuamos si el foco SE PERDIÓ de verdad. Eso deja fuera, sin
   * condicionar por modo, el caso `trigger="card"` (ahí el foco vive en la card,
   * que es padre de las caras y nunca se vuelve inerte) y cualquier flip
   * programático que no venía del usuario.
   */
  useEffect(() => {
    if (!userFlipped.current) return;
    const active = document.activeElement;
    if (active && active !== document.body) return;

    const face = flipRef.current?.querySelector<HTMLElement>(
      flipped ? '.un-holo-flip__face--back' : '.un-holo-flip__face',
    );
    face
      ?.querySelector<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )
      // La cara entra rotando; sin esto el navegador saltaría el scroll al vuelo.
      ?.focus({ preventScroll: true });
  }, [flipped]);

  const triggerProps = cardIsTrigger
    ? ({
        role: 'button',
        tabIndex: 0,
        'aria-pressed': flipped,
        'aria-label': flipped ? flipLabels.toFront : flipLabels.toBack,
        onClick: toggle,
        onKeyDown: handleKeyDown,
      } as const)
    : null;

  return (
    <div
      ref={ref}
      className={cn(
        'un-holo rounded-lg',
        cardIsTrigger && 'cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
      onPointerEnter={motionOk ? handleEnter : undefined}
      onPointerMove={motionOk ? handleMove : undefined}
      onPointerLeave={motionOk ? handleLeave : undefined}
      onPointerCancel={motionOk ? handleLeave : undefined}
      {...triggerProps}
    >
      <FlipContext.Provider value={{ flipped, toggle }}>
        <div
          ref={flipRef}
          className="un-holo-flip h-full rounded-lg"
          data-flipped={flipped ? 'true' : undefined}
        >
          {/* `relative` ancla el foil/shine (inset:0) y `rounded-lg` es de donde
              heredan su border-radius. */}
          <div
            className="un-holo-flip__face relative h-full rounded-lg"
            aria-hidden={canFlip && flipped}
            inert={canFlip && flipped}
          >
            {children}
            <span className="un-holo__foil" aria-hidden="true" />
            <span className="un-holo__shine" aria-hidden="true" />
          </div>
          {canFlip ? (
            // Cada cara se oculta al teclado y al lector mientras no está de
            // frente: si no, se tabula "a través" de algo que no está en pantalla.
            <div
              className="un-holo-flip__face un-holo-flip__face--back rounded-lg"
              aria-hidden={!flipped}
              inert={!flipped}
            >
              {back}
            </div>
          ) : null}
        </div>
      </FlipContext.Provider>
    </div>
  );
}

/**
 * Dispara el flip desde dentro de la card. Existe para el caso `trigger="slot"`:
 * cuando la cara ya tiene links propios no podemos hacer botón la card entera,
 * así que el control es un botón hermano del link y no anidado (HTML válido).
 */
export function HoloFlipButton({
  children,
  className,
  label,
}: {
  children: ReactNode;
  className?: string;
  /** Qué hace el botón, en español. Obligatorio: el icono solo no lo dice. */
  label: string;
}) {
  const ctx = useContext(FlipContext);
  if (!ctx) return null;

  return (
    <button type="button" onClick={ctx.toggle} aria-pressed={ctx.flipped} aria-label={label} className={className}>
      {children}
    </button>
  );
}
