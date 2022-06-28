import type { GameEntity } from "./game-entity";
import type {
  ComponentFilterTuple,
  ComponentInstances,
  ComponentTuple,
} from "./types";

/**
 * A self-updating query that tracks all entities that match with the query's
 *  component filters.
 */
export abstract class EntityQuery<TFilter extends ComponentFilterTuple> {
  protected readonly entities: Set<GameEntity>;
  protected readonly components: ComponentTuple<TFilter>;

  protected constructor(
    entities: Set<GameEntity>,
    components: ComponentTuple<TFilter>
  ) {
    this.entities = entities;
    this.components = components;
  }

  /**
   * Get the components of the query's entities.
   */
  public *[Symbol.iterator](): IterableIterator<ComponentInstances<TFilter>> {
    for (const entity of this.entities) {
      yield this.components.map((component) =>
        entity.get(component)
      ) as ComponentInstances<TFilter>;
    }
  }

  /**
   * Get the query entities and their components.
   */
  public *withEntities(): IterableIterator<
    [GameEntity, ...ComponentInstances<TFilter>]
  > {
    for (const entity of this.entities) {
      yield [
        entity,
        ...(this.components.map((component) =>
          entity.get(component)
        ) as ComponentInstances<TFilter>),
      ];
    }
  }

  /**
   * Get only the entities in the query.
   */
  public *asEntities(): IterableIterator<GameEntity> {
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
