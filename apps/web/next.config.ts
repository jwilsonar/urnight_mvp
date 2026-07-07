import path from 'node:path';
import type { NextConfig } from 'next';

// Host del almacenamiento de objetos en dev (LocalStack S3). El optimizador de
// next/image rechaza un host si su patrón (protocolo+host+puerto) no está aquí;
// sin el puerto, http://localhost:4566 no hace match y devuelve 400. En prod las
// imágenes llegan como URLs https de S3/CDN, ya cubiertas por el comodín https.
const storageUrl = new URL(process.env.NEXT_PUBLIC_STORAGE_URL || 'http://localhost:4566');

const nextConfig: NextConfig = {
  // Build autocontenido para Docker: .next/standalone lleva solo los node_modules
  // realmente usados (~200MB vs copiar el monorepo entero). `next dev` lo ignora.
  output: 'standalone',
  // En monorepo pnpm el file tracing debe anclarse a la raíz del workspace;
  // sin esto Next puede inferir mal la raíz y omitir deps del standalone.
  outputFileTracingRoot: path.join(__dirname, '../../'),
  // Compila los packages del workspace (TS source) consumidos por la app.
  transpilePackages: ['@urnight/contracts', '@urnight/ui'],
  images: {
    // Imágenes desde S3/CDN (URLs https) y el storage local (LocalStack) en dev.
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      {
        protocol: storageUrl.protocol.replace(':', '') as 'http' | 'https',
        hostname: storageUrl.hostname,
        port: storageUrl.port || undefined,
      },
    ],
  },
};

export default nextConfig;
