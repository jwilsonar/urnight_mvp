import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

/**
 * Tier E2E: contrato HTTP con la app NestJS levantada (Supertest).
 * Aislado por sufijo `*.e2e.spec.ts` (+ legacy recursivo bajo `test/`, `*.e2e-spec.ts`).
 * `passWithNoTests` mantiene el script verde mientras este tier aún no tiene specs.
 */
export default defineConfig({
  test: {
    globals: true,
    root: './',
    include: ['src/**/*.e2e.spec.ts', 'test/**/*.e2e-spec.ts'],
    passWithNoTests: true,
    // 15s solo como margen para el arranque de la app Nest en máquinas lentas
    // (CI). El TRUNCATE por test dejó de ser el cuello de botella al desactivar
    // fsync en el Postgres local de docker-compose.
    hookTimeout: 15_000,
  },
  plugins: [swc.vite({ module: { type: 'es6' } })],
});
