'use client';

import { m } from 'framer-motion';
import type { ReactNode } from 'react';

export function Marquee({ children, speed = 40 }: { children: ReactNode; speed?: number }) {
  return (
    <div
      className="overflow-hidden"
      style={{
        maskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
        WebkitMaskImage:
          'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
      }}
    >
      <m.div
        className="flex w-max gap-4"
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: speed, ease: 'linear', repeat: Infinity }}
      >
        {children}
        {children}
      </m.div>
    </div>
  );
}
