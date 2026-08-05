"use client";

import { usePathname } from "next/navigation";
import { SiteFooter } from "@/components/shared/site-footer";

/**
 * Elige la variante del pie según la ruta. En flujos transaccionales (reserva
 * de mesa, carta in-venue) el pie completo solo mete scroll: ahí va la barra
 * legal `slim`. En descubrimiento (home, /events, /locals, detalle, FAQ,
 * nosotros) va el pie `full` como navegación.
 *
 * Vive en un componente cliente porque la decisión depende de `usePathname`;
 * el layout de (consumer) es server component y no puede leerlo.
 */
const TRANSACTIONAL = [/^\/reserva(\/|$)/, /^\/locals\/[^/]+\/carta(\/|$)/];

export function ConditionalFooter() {
  const pathname = usePathname();
  const slim = TRANSACTIONAL.some((re) => re.test(pathname));
  return <SiteFooter variant={slim ? "slim" : "full"} />;
}
