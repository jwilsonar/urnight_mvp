/**
 * Hook oficial de arranque de Next (corre una vez por proceso de servidor).
 * Con `output: 'standalone'` el next.config NO se re-evalúa en runtime, por lo
 * que la validación de entorno debe vivir aquí y no en la config. El guard de
 * runtime evita ejecutar la validación en el runtime edge (proxy.ts).
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { validateEnv } = await import('./lib/config/env.schema');
    validateEnv(process.env);
  }
}
