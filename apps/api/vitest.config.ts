import swc from 'unplugin-swc';
import { configDefaults, defineConfig } from 'vitest/config';

/**
 * Config base = tier UNITARIO. Convención del proyecto: tests colocados junto al
 * código fuente (`*.spec.ts`). Los tiers superiores se separan por sufijo de
 * archivo y config dedicada:
 *   - unit:        *.spec.ts                  (este config)
 *   - integration: *.integration.spec.ts     (vitest.integration.config.ts)
 *   - e2e:         *.e2e.spec.ts              (vitest.e2e.config.ts)
 * Excluimos integration/e2e aquí para que `test`/`test:unit`/`test:cov` solo
 * corran la base pura (sin Docker/Postgres).
 */
export default defineConfig({
  test: {
    globals: true,
    root: './',
    include: ['src/**/*.spec.ts'],
    exclude: [
      ...configDefaults.exclude,
      '**/*.integration.spec.ts',
      '**/*.e2e.spec.ts',
    ],
    coverage: {
      provider: 'v8',
      // Todos los bounded contexts: domain + application (tier unitario).
      include: ['src/modules/**/domain/**', 'src/modules/**/application/**'],
      thresholds: { lines: 80, functions: 80, branches: 75 },
    },
  },
  plugins: [
    // Habilita decoradores + metadata de NestJS en los tests.
    swc.vite({ module: { type: 'es6' } }),
  ],
});
