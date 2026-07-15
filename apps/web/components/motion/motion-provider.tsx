'use client';

import { domAnimation, LazyMotion, MotionConfig } from 'framer-motion';
import type { ReactNode } from 'react';

/**
 * Capa de motion global. LazyMotion + domAnimation carga solo el subset DOM
 * (~15kb en vez de ~34kb). `reducedMotion="user"` respeta la preferencia del
 * sistema en TODA la app sin repetir checks en cada componente.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig
        reducedMotion="user"
        transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
      >
        {children}
      </MotionConfig>
    </LazyMotion>
  );
}
