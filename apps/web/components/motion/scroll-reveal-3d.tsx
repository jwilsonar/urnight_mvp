'use client';

import { m } from 'framer-motion';
import type { ReactNode } from 'react';

export function ScrollReveal3d({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <m.div
      className={className}
      style={{ transformPerspective: 900 }}
      initial={{ opacity: 0, y: 24, rotateX: 8 }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, delay: delay / 1000, ease: [0.23, 1, 0.32, 1] }}
    >
      {children}
    </m.div>
  );
}
