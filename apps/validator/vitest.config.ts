import { defineConfig } from 'vitest/config';

/**
 * Pruebas de los módulos PUROS del validador. Entorno `node`: aquí no se monta
 * React Native ni se carga ningún módulo de Expo. Cualquier lógica que necesite
 * plataforma vive en un fichero aparte del que se prueba (ver `lib/auth.ts`
 * frente a `lib/session-rules.ts`).
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['lib/**/*.spec.ts'],
  },
});
