"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@urnight/ui";

const SCROLL_THRESHOLD = 5;
const TOP_SAFE_AREA = 64;

const HeaderMenuContext = createContext<((open: boolean) => void) | undefined>(
  undefined,
);

export function useHeaderMenuState() {
  return useContext(HeaderMenuContext);
}

export function HideOnScrollHeader({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const [hidden, setHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuOpenRef = useRef(false);
  const frameRef = useRef(0);
  const lastYRef = useRef(0);
  const directionRef = useRef<"up" | "down" | null>(null);
  const distanceRef = useRef(0);

  useEffect(() => {
    menuOpenRef.current = menuOpen;
    if (menuOpen) setHidden(false);
  }, [menuOpen]);

  useEffect(() => {
    lastYRef.current = window.scrollY;

    const update = () => {
      frameRef.current = 0;
      const currentY = Math.max(window.scrollY, 0);
      const delta = currentY - lastYRef.current;
      lastYRef.current = currentY;

      if (currentY <= TOP_SAFE_AREA || menuOpenRef.current) {
        directionRef.current = null;
        distanceRef.current = 0;
        setHidden(false);
        return;
      }

      if (delta === 0) return;
      const direction = delta > 0 ? "down" : "up";
      if (directionRef.current !== direction) {
        directionRef.current = direction;
        distanceRef.current = 0;
      }
      distanceRef.current += Math.abs(delta);

      if (distanceRef.current < SCROLL_THRESHOLD) return;
      distanceRef.current = 0;
      setHidden(direction === "down");
    };

    const onScroll = () => {
      if (!frameRef.current) frameRef.current = requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  return (
    <HeaderMenuContext.Provider value={setMenuOpen}>
      <header
        className={cn(
          "sticky top-0 z-40 h-16 w-full border-b bg-background/95 backdrop-blur-xl will-change-transform",
          "transition-transform duration-300 ease-[var(--ease-brand)] motion-reduce:transition-none",
          hidden && "-translate-y-full",
          className,
        )}
        data-header-hidden={hidden ? "true" : "false"}
        onFocusCapture={() => setHidden(false)}
      >
        {children}
      </header>
    </HeaderMenuContext.Provider>
  );
}
