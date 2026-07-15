'use client';

/**
 * Muro de Noches: el hero deja de ser texto sobre un gradiente y pasa a ser un
 * plano inclinado con filas de posters deslizándose en sentidos opuestos. Al
 * scrollear, el plano se endereza hacia la cámara y las filas frenan: la
 * sensación es que entras a la noche.
 *
 * Solo CSS 3D + framer-motion (nada de WebGL). El contrato visual vive en
 * globals.css (`.un-wall`, `.un-wall__row`, `.un-poster`); aquí solo se
 * orquesta el movimiento.
 */

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import Link from 'next/link';
import { m, useScroll, useSpring, useTransform } from 'framer-motion';
import type { EventResponse } from '@urnight/contracts';
import { cn } from '@urnight/ui';
import { Stage } from '@/components/motion/stage';
import { StorageImage } from '@/lib/storage/storage-context';
import { formatDate } from '@/lib/utils/format';

const ROWS = 3;
/** Mínimo de tiles por fila para que el muro no deje huecos con pocos eventos. */
const MIN_TILES_PER_ROW = 6;
/** Techo de tiles por fila: cada uno es un nodo + una imagen. 3×8 = 24 y para. */
const MAX_TILES_PER_ROW = 8;

/** Banda violeta-azul de marca (amatista → lavanda → info). Fuera de aquí no se sale. */
const POSTER_HUE_MIN = 238;
const POSTER_HUE_SPAN = 42;

/** Las filas nacen y mueren difuminadas: sin esto se ve el borde del último tile. */
const EDGE_MASK = 'linear-gradient(to right, transparent, #000 14%, #000 86%, transparent)';

const SPRING = { stiffness: 90, damping: 24, mass: 0.4 } as const;

interface Tile {
  key: string;
  event: EventResponse;
  /** Gradiente de respaldo, ya resuelto: no se recalcula por render. */
  background: string;
}

/**
 * FNV-1a de 32 bits. Pura y sin estado: el mismo evento da el mismo poster en
 * servidor y en cliente. Con Math.random()/Date.now() el HTML del SSR no
 * coincidiría con el del primer render y React tiraría el árbol entero.
 *
 * El producto FNV (16777619 = 2^24+2^8+2^7+2^4+2^1+1) se hace con sumas de
 * shifts porque `h * 16777619` desborda el double de JS y pierde bits bajos.
 */
function hash32(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = (h + (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24)) >>> 0;
  }
  return h >>> 0;
}

/**
 * Poster de respaldo para eventos sin flyer. El hue sale del hash pero acotado
 * a la banda de marca: lo que varía de verdad es el ángulo, la saturación y la
 * luminosidad, así dos eventos nunca se ven iguales sin que ninguno se salga de
 * la paleta. Se mantiene oscuro a propósito — encima va el nombre en blanco.
 */
function posterGradient(event: EventResponse): string {
  const h = hash32(`${event.id}:${event.name}`);
  const hueA = POSTER_HUE_MIN + (h % POSTER_HUE_SPAN);
  const hueB = POSTER_HUE_MIN + ((h >>> 9) % POSTER_HUE_SPAN);
  const angle = 120 + ((h >>> 17) % 120);
  const sat = 58 + ((h >>> 5) % 30);
  const light = 26 + ((h >>> 13) % 16);
  return `linear-gradient(${angle}deg, hsl(${hueA} ${sat}% ${light}%), hsl(${hueB} ${Math.min(
    sat + 10,
    92,
  )}% ${Math.max(light - 14, 8)}%))`;
}

/**
 * Reparte los eventos en filas repitiendo la lista hasta llenar. Cada fila
 * arranca desplazada `stride` posiciones: si no, con un número de eventos
 * múltiplo de 3 las tres filas mostrarían la misma secuencia.
 */
function buildRows(events: EventResponse[]): Tile[][] {
  const perRow = Math.min(
    Math.max(Math.ceil(events.length / ROWS), MIN_TILES_PER_ROW),
    MAX_TILES_PER_ROW,
  );
  const stride = Math.max(1, Math.floor(events.length / ROWS));
  // El gradiente se cachea por evento: un evento repetido en varias filas es el
  // mismo poster, y hash32 no se ejecuta una vez por tile.
  const backgrounds = new Map<string, string>();

  return Array.from({ length: ROWS }, (_, r) =>
    Array.from({ length: perRow }, (_, c) => {
      const event = events[(c + r * stride) % events.length]!;
      let background = backgrounds.get(event.id);
      if (!background) {
        background = posterGradient(event);
        backgrounds.set(event.id, background);
      }
      // La key lleva fila+columna: el evento se repite, la key no.
      return { key: `${event.id}-${r}-${c}`, event, background };
    }),
  );
}

export function NightWall({ events, className }: { events: EventResponse[]; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [reduced, setReduced] = useState(false);

  // Los valores derivados de useScroll no los apaga `MotionConfig
  // reducedMotion="user"` (no son props animadas), así que hay que
  // neutralizarlos a mano.
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });

  // El plano se endereza hacia la cámara mientras entras.
  const rotateX = useSpring(useTransform(scrollYProgress, [0, 0.6], [18, 0]), SPRING);
  // Tramo no lineal: las filas corren al principio y frenan al final.
  const xA = useSpring(useTransform(scrollYProgress, [0, 0.5, 1], [0, -150, -200]), SPRING);
  const xB = useSpring(useTransform(scrollYProgress, [0, 0.5, 1], [0, 150, 200]), SPRING);

  const rows = useMemo(() => (events.length ? buildRows(events) : []), [events]);
  if (!rows.length) return null;

  return (
    // Envoltorio plano: recorta el ancho de las filas (si no, hay scroll
    // horizontal en la página). Va POR FUERA de Stage a propósito — `overflow`
    // fuerza `transform-style: flat` y aplicado al escenario mataría el 3D.
    //
    // aria-hidden + tabIndex=-1 en los tiles: el muro es DECORACIÓN. Repite los
    // mismos eventos que las grillas de abajo (hasta 18 tiles para 8 eventos,
    // varios al mismo href), así que para lector de pantalla es ruido duplicado.
    // Y al tabular hacia un tile recortado, el navegador scrollea este
    // `overflow-hidden` por dentro: el muro se desplaza y no vuelve. Sacándolo
    // del orden de tabulación se arreglan las dos cosas a la vez, y el ratón
    // sigue pudiendo clicar. aria-hidden exige que nada dentro sea focuseable:
    // por eso el tabIndex=-1 es obligatorio, no opcional.
    <div
      ref={ref}
      aria-hidden="true"
      className={cn('relative overflow-hidden', className)}
      style={{ maskImage: EDGE_MASK, WebkitMaskImage: EDGE_MASK }}
    >
      <Stage perspective={1400} origin="50% 30%">
        <m.div
          className="un-wall flex flex-col items-center gap-5"
          style={
            reduced ? { transformStyle: 'preserve-3d' } : { rotateX, transformStyle: 'preserve-3d' }
          }
        >
          {rows.map((row, r) => (
            <m.div
              key={r}
              className="un-wall__row"
              // preserve-3d en cada eslabón: la fila lleva transform propio
              // (x) y, si quedara `flat`, aplastaría el translateZ del hover
              // del poster contra el plano de la fila.
              style={
                reduced
                  ? { transformStyle: 'preserve-3d' }
                  : { x: r === 1 ? xB : xA, transformStyle: 'preserve-3d' }
              }
            >
              {row.map(({ key, event, background }) => (
                <Link
                  key={key}
                  href={`/events/${event.slug}`}
                  // Fuera del orden de tabulación: lo exige el aria-hidden del
                  // envoltorio (ver arriba). El evento se alcanza con teclado
                  // desde las grillas de abajo, que son la ruta real.
                  tabIndex={-1}
                  className="un-poster aspect-[3/4] w-[168px] shrink-0 sm:w-[224px]"
                  style={{ '--poster-bg': background } as CSSProperties}
                >
                  {event.flyerUrl ? (
                    // Sin `priority`: son ~24 imágenes y precargarlas todas
                    // arruinaría el LCP en vez de mejorarlo.
                    <StorageImage
                      src={event.flyerUrl}
                      alt=""
                      fill
                      sizes="(min-width: 640px) 224px, 168px"
                      className="object-cover"
                    />
                  ) : null}
                  {/* Scrim: el gradiente de respaldo ya es oscuro, pero un
                      flyer real puede ser claro y comerse el texto. */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-3">
                    {/* Blanco, no `text-primary`: ese token es #6c4dff (relleno de
                        marca, pensado para fondos, no para texto) y sobre el scrim
                        da 4.06:1 — por debajo del 4.5:1 que pide AA a 14px, y menos
                        legible que su propio subtítulo. */}
                    <p className="font-display line-clamp-2 text-sm leading-tight text-white">
                      {event.name}
                    </p>
                    <p className="mt-1 text-[11px] text-white/70">{formatDate(event.startsAt)}</p>
                  </div>
                </Link>
              ))}
            </m.div>
          ))}
        </m.div>
      </Stage>
    </div>
  );
}
