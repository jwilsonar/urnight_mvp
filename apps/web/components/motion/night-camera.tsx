"use client";

/**
 * Cámara por scroll: la sección llega desde el fondo en Z conforme entra al
 * viewport, como si la cámara se acercara a ella dentro del local.
 *
 * El scroll nativo manda: solo mapeamos su progreso a transforms. Nada de
 * scroll-jacking ni de retener contenido — esto es un marketplace, la gente
 * viene a comprar una entrada rápido, no a ver una demo. Por eso la opacidad
 * arranca en 0.35 (nunca en 0): la sección se lee desde antes de aterrizar.
 *
 * Diferencia con ScrollReveal3d: aquel dispara un reveal de una vez con
 * whileInView y se acabó. Este está ligado al progreso del scroll, así que la
 * sección se acerca mientras bajas y retrocede si subes.
 */

import { m, useScroll, useSpring, useTransform } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Stage } from "@/components/motion/stage";

/**
 * El CSS del repo ya apaga sus propias clases con prefers-reduced-motion, pero
 * estos transforms los escribe framer inline y hay que apagarlos desde JS.
 * Arranca en false (no en matchMedia) para que servidor y cliente hidraten
 * igual; el effect corrige en el primer frame.
 */
function useReducedMotionPref() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return reduced;
}

export function NightCamera({
  children,
  className,
  depth = 220,
  disabled = false,
}: {
  children: ReactNode;
  className?: string;
  /** Cuánta Z recorre la sección al entrar, en px. Más = más agresivo. */
  depth?: number;
  disabled?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotionPref();
  const inert = disabled || reduced;

  // De "el borde superior toca el fondo del viewport" a "el centro de la
  // sección llega al centro del viewport": aterriza a mitad de recorrido, así
  // que el contenido queda quieto y legible bastante antes de que termines de
  // pasar por él. El ref va en el wrapper SIN transform a propósito: medir un
  // nodo que nosotros mismos movemos en Z realimenta el cálculo y tiembla.
  //
  // Ojo al integrar: una sección que nunca llega a centrarse en el viewport
  // (la última de la página, sin scroll suficiente debajo) se queda con
  // progress < 1 PARA SIEMPRE: algo atenuada y desplazada en Z, sin aterrizar
  // nunca. No envuelvas con esto el último bloque de una página.
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "center center"],
  });

  // Un solo muelle sobre el progreso (más barato que uno por transform) para
  // que el movimiento no copie el jitter de la rueda del mouse.
  const progress = useSpring(scrollYProgress, {
    stiffness: 140,
    damping: 28,
    mass: 0.4,
    restDelta: 0.001,
  });

  // Con inert los rangos colapsan a constantes: mismo árbol, mismos estilos
  // inline, cero movimiento y contenido al 100%. Cambiar `style` a undefined
  // dejaría pegado el transform inline del render anterior.
  const z = useTransform(progress, [0, 1], inert ? [0, 0] : [-depth, 0]);
  const rotateX = useTransform(progress, [0, 1], inert ? [0, 0] : [6, 0]);
  const opacity = useTransform(progress, [0, 1], inert ? [1, 1] : [0.35, 1]);

  return (
    <div ref={ref} className={className}>
      {/* Perspectiva propia (no exigida al padre): sin un ancestro con
          perspective el translateZ no se ve y falla en silencio, y así todos
          los hijos de la sección comparten punto de fuga. */}
      <Stage perspective={1400}>
        {/* El plano 3D no captura hits durante el scroll; el contenido conserva
            sus eventos en el wrapper interior y los botones siguen operables. */}
        <m.div
          style={{ z, rotateX, opacity }}
          // Red de seguridad para el primer frame, antes de que corra el
          // effect: una regla !important sí gana a un style inline sin él.
          className="pointer-events-none motion-reduce:transform-none! motion-reduce:opacity-100!"
        >
          <div className="pointer-events-auto">{children}</div>
        </m.div>
      </Stage>
    </div>
  );
}
