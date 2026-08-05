"use client";

import { m, useScroll, useTransform } from "framer-motion";
import type { ReactNode } from "react";

export function HeroParallax({ children }: { children: ReactNode }) {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 600], [0, 120]);
  const opacity = useTransform(scrollY, [0, 500], [1, 0.35]);

  // El glow se aleja al bajar: capas a distinta velocidad producen profundidad.
  return (
    <m.div
      style={{ y, opacity }}
      className="pointer-events-none absolute inset-0 -z-10"
    >
      {children}
    </m.div>
  );
}
