/**
 * Base genérica para repositorios en memoria (tier unitario). Almacena entidades
 * por `id` en un Map. Cada repo de módulo extiende esta base e implementa SU
 * puerto exacto (los puertos del dominio usan create/update + finders propios,
 * no un save/delete genérico). Reemplaza a Drizzle en los tests unitarios:
 * NUNCA se mockea el ORM (estrategia de testing UrNight).
 */
export abstract class InMemoryRepository<T extends { id: string }> {
  protected readonly items = new Map<string, T>();

  protected getById(id: string): T | null {
    return this.items.get(id) ?? null;
  }

  protected put(entity: T): void {
    this.items.set(entity.id, entity);
  }

  protected values(): T[] {
    return [...this.items.values()];
  }

  /** Estado actual (solo lectura) — útil para aserciones en los tests. */
  get all(): readonly T[] {
    return this.values();
  }

  get size(): number {
    return this.items.size;
  }

  clear(): void {
    this.items.clear();
  }
}
