"use client";

import { type ReactNode, useEffect, useRef } from "react";

const DESKTOP_QUERY = "(min-width: 1024px)";
const TOP_OFFSET = 96;
const BOTTOM_GAP = 32;

export function StickyTicketSidebar({ children }: { children: ReactNode }) {
  const boundaryRef = useRef<HTMLElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const boundary = boundaryRef.current;
    const sidebar = sidebarRef.current;
    if (!boundary || !sidebar) return;

    const desktop = window.matchMedia(DESKTOP_QUERY);
    let frame = 0;
    let lastScrollY = window.scrollY;
    let offset = 0;

    const clamp = (value: number, maximum: number) =>
      Math.min(Math.max(value, 0), maximum);

    const update = () => {
      frame = 0;
      const scrollY = window.scrollY;

      if (!desktop.matches) {
        offset = 0;
        lastScrollY = scrollY;
        sidebar.style.transform = "";
        return;
      }

      const boundaryTop = boundary.getBoundingClientRect().top + scrollY;
      const sidebarHeight = sidebar.offsetHeight;
      const maximum = Math.max(0, boundary.offsetHeight - sidebarHeight);

      if (sidebarHeight + TOP_OFFSET + BOTTOM_GAP <= window.innerHeight) {
        offset = clamp(scrollY + TOP_OFFSET - boundaryTop, maximum);
      } else if (scrollY >= lastScrollY) {
        const pinBottomAt = clamp(
          scrollY +
            window.innerHeight -
            BOTTOM_GAP -
            boundaryTop -
            sidebarHeight,
          maximum,
        );
        offset = Math.max(offset, pinBottomAt);
      } else {
        const pinTopAt = clamp(scrollY + TOP_OFFSET - boundaryTop, maximum);
        offset = Math.min(offset, pinTopAt);
      }

      offset = clamp(offset, maximum);
      sidebar.style.transform = `translate3d(0, ${offset}px, 0)`;
      lastScrollY = scrollY;
    };

    const requestUpdate = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    const resizeObserver = new ResizeObserver(requestUpdate);
    resizeObserver.observe(boundary);
    resizeObserver.observe(sidebar);
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    desktop.addEventListener("change", requestUpdate);
    update();

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
      desktop.removeEventListener("change", requestUpdate);
    };
  }, []);

  return (
    <aside ref={boundaryRef} className="relative min-w-0">
      <div ref={sidebarRef} className="lg:will-change-transform">
        {children}
      </div>
    </aside>
  );
}
