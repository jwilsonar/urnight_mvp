import type { Database } from '@urnight/db';

/** Token de inyección del cliente Drizzle (la instancia `db`). */
export const DRIZZLE = Symbol('DRIZZLE');

/** Tipo del valor inyectado bajo el token DRIZZLE. */
export type DrizzleDb = Database;
