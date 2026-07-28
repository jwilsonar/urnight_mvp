"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * Mantiene la semántica de navegación del navegador:
 * - PUSH a otra pantalla: empieza arriba.
 * - POP (Atrás/Adelante): deja que el navegador restaure la posición.
 * - enlaces con hash: deja que el navegador resuelva el ancla.
 */
export function NavigationScrollManager() {
  const pathname = usePathname();
  const navigationRef = useRef<"initial" | "push" | "pop">("initial");

  useEffect(() => {
    const markPopNavigation = () => {
      navigationRef.current = "pop";
    };

    window.addEventListener("popstate", markPopNavigation);
    return () => window.removeEventListener("popstate", markPopNavigation);
  }, []);

  useEffect(() => {
    if (navigationRef.current === "initial") {
      navigationRef.current = "push";
      return;
    }

    if (navigationRef.current === "pop") {
      navigationRef.current = "push";
      return;
    }

    if (window.location.hash) return;
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname]);

  return null;
}
