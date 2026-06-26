/**
 * Utilidades de testing compartidas (shared kernel de tests).
 *   - in-memory/  → repositorios en memoria que implementan los puertos del dominio
 *   - fakes/      → dobles de puertos de servicio (hasher, tokens, google, outbox, uow) + captura de eventos
 *   - builders/   → builders fluidos por entidad
 *   - mothers/    → casos predefinidos (Object Mothers)
 * Sin imports de NestJS/Drizzle/Redis ni de vitest: agnósticas del framework.
 */
export * from './in-memory/identity';
export { InMemoryRepository } from './in-memory/in-memory.repository';
export * from './fakes';
export * from './builders';
export * from './mothers';
