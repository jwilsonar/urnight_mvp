import path from 'node:path';
import type { NextConfig } from 'next';

// Host del almacenamiento de objetos en dev (LocalStack S3). El optimizador de
// next/image rechaza un host si su patrón (protocolo+host+puerto) no está aquí;
// sin el puerto, http://localhost:4566 no hace match y devuelve 400. En prod las
// imágenes llegan como URLs https de S3/CDN, ya cubiertas por el comodín https.
const storageUrl = new URL(process.env.NEXT_PUBLIC_STORAGE_URL || 'http://localhost:4566');
const apiUrl = new URL(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3101/api/v1');
const isDev = process.env.NODE_ENV !== 'production';

/**
 * CSP de la app. Orígenes externos reales: Google Maps JS API (script + XHR +
 * fuentes Roboto), storage S3/LocalStack (imágenes y PUT XHR a URLs presignadas)
 * y el API NestJS. `'unsafe-inline'` en script-src es obligatorio con CSP
 * estática en App Router (Next inyecta scripts inline de hidratación); la
 * variante estricta con nonce por-request queda como endurecimiento futuro.
 * data: = QR de tickets; blob: = previews del dropzone; ws:/eval solo en dev (HMR).
 */
const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  `script-src 'self' 'unsafe-inline' https://maps.googleapis.com${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  // https: refleja el comodín de remotePatterns (imágenes externas del catálogo).
  `img-src 'self' data: blob: https: ${storageUrl.origin}`,
  "font-src 'self' data: https://fonts.gstatic.com",
  // El host presignado de S3 en prod puede diferir de NEXT_PUBLIC_STORAGE_URL:
  // *.amazonaws.com lo cubre; el periodo Report-Only revela el host exacto.
  `connect-src 'self' ${apiUrl.origin} ${storageUrl.origin} https://maps.googleapis.com https://*.amazonaws.com${isDev ? ' ws: wss:' : ''}`,
  "worker-src 'self' blob:",
  ...(isDev ? [] : ['upgrade-insecure-requests']),
  'report-uri /api/csp-report',
].join('; ');

// Report-Only por defecto; CSP_ENFORCE=true la vuelve bloqueante una vez
// observado /api/csp-report sin violaciones legítimas (3-7 días en staging).
const cspHeader =
  process.env.CSP_ENFORCE === 'true'
    ? 'Content-Security-Policy'
    : 'Content-Security-Policy-Report-Only';

const securityHeaders = [
  { key: cspHeader, value: csp },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), fullscreen=(self)',
  },
  // HSTS solo fuera de dev: en http los browsers lo ignoran y no debe cachearse.
  ...(isDev
    ? []
    : [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' }]),
];

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
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
