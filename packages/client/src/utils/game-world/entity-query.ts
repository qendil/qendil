import type { GameEntity } from "./game-entity";

/**
 * A self-updating query that tracks all entities that match with the query's
 *  component filters.
 */
export abstract class EntityQuery {
  protected readonly entities: Set<GameEntity>;

  protected constructor(entities: Set<GameEntity>) {
    this.entities = entities;
  }

  /**
   * Iterates over all entities in the query.
   */
  public *[Symbol.iterator](): IterableIterator<GameEntity> {
    yield* this.entities;
  }

  /**
   * Check if a given entity is in the query.
   *
   * @param entity - The entity to check for
   * @returns `true` if the entity is in the query
   */
  public has(entity: GameEntity): boolean {
    return this.entities.has(entity);
  }

  /**
   * Get the number of entities in the query.
   */
  public get size(): number {
    return this.entities.size;
  }
}
