import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

/**
 * Tier INTEGRACIÓN: infrastructure/persistence contra Postgres efímero (5433,
 * base `urnight_test`). Aislado por sufijo `*.integration.spec.ts`.
 * - globalSetup crea la BD y aplica migraciones una sola vez.
 * - fileParallelism=false: los specs comparten la misma BD; se serializan para
 *   evitar carreras entre truncates.
 * - passWithNoTests mantiene el script verde si todavía no hay specs.
 */
export default defineConfig({
  test: {
    globals: true,
    root: './',
    include: ['src/**/*.integration.spec.ts'],
    globalSetup: ['./src/shared/testing/integration/global-setup.ts'],
    fileParallelism: false,
    hookTimeout: 60000,
    testTimeout: 30000,
    passWithNoTests: true,
  },
  plugins: [swc.vite({ module: { type: 'es6' } })],
});
