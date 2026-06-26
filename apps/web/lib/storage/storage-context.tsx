'use client';

import Image, { type ImageProps } from 'next/image';
import { createContext, useContext, useMemo, type ReactNode } from 'react';

/**
 * Storage Provider — lado de LECTURA/render, SIN credenciales.
 *
 * Centraliza la configuración del object storage (LocalStack en dev, S3/CDN en
 * prod) y la expone vía Context + hook `useStorage`. A diferencia del patrón
 * "S3Client en el navegador", NO instancia el AWS SDK en cliente: eso filtraría
 * las credenciales (`NEXT_PUBLIC_AWS_*`) y rompe §5 del PROJECT_SPECS — "el
 * cliente sube/descarga directo, la API solo firma". Las subidas siguen yendo
 * por presign (`lib/api/uploads.ts`); este provider solo decide cómo se
 * RESUELVEN y RENDERIZAN las imágenes ya almacenadas.
 *
 * Por qué resuelve el bug de imágenes rotas: el optimizador de `next/image`
 * exige que cada host esté en `remotePatterns` (y reiniciar el dev server al
 * tocarlos); para el storage `http` local eso es frágil y devuelve
 * `400 "url" parameter is not allowed`. Aquí centralizamos la política: las
 * imágenes servidas por `http` (dev/LocalStack) se renderizan `unoptimized`
 * (van directo al origen, sin pasar por `/_next/image` ni por el allowlist); en
 * prod el CDN es `https` y sí se optimizan. Multi-tenant futuro: pasar un
 * `baseUrl` distinto por tenant en el prop `config` del provider.
 */

interface StorageConfig {
  /** Base del storage para el entorno/tenant actual (sin barra final). */
  baseUrl: string;
}

interface StorageContextValue {
  baseUrl: string;
  /** key de S3 → URL absoluta. URL absoluta (http/https) → tal cual (seed/externas). */
  resolve: (ref: string) => string;
  /** ¿Debe `next/image` optimizar esta URL? `false` para `http` (dev/LocalStack). */
  shouldOptimize: (url: string) => boolean;
}

const DEFAULT_BASE = process.env.NEXT_PUBLIC_STORAGE_URL ?? 'http://localhost:4566';

const StorageContext = createContext<StorageContextValue | null>(null);

export function StorageProvider({
  children,
  config,
}: {
  children: ReactNode;
  config?: Partial<StorageConfig>;
}) {
  const value = useMemo<StorageContextValue>(() => {
    const baseUrl = (config?.baseUrl ?? DEFAULT_BASE).replace(/\/+$/, '');
    return {
      baseUrl,
      resolve: (ref) =>
        /^https?:\/\//i.test(ref) ? ref : `${baseUrl}/${ref.replace(/^\/+/, '')}`,
      shouldOptimize: (url) => !url.startsWith('http://'),
    };
  }, [config?.baseUrl]);

  return <StorageContext.Provider value={value}>{children}</StorageContext.Provider>;
}

export function useStorage(): StorageContextValue {
  const ctx = useContext(StorageContext);
  if (!ctx) throw new Error('useStorage debe usarse dentro de <StorageProvider>');
  return ctx;
}

/**
 * Drop-in de `next/image` para imágenes del object storage. Resuelve la ref
 * (key o URL) y decide `unoptimized` según el origen. Úsalo en lugar de
 * `<Image>` para cualquier imagen que venga del storage (locales, flyers, etc.).
 */
export function StorageImage({ src, ...props }: Omit<ImageProps, 'src'> & { src: string }) {
  const { resolve, shouldOptimize } = useStorage();
  const url = resolve(src);
  return <Image src={url} unoptimized={!shouldOptimize(url)} {...props} />;
}
