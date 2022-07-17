import type { EcsEntity } from "./ecs-entity";
import type EcsQueryBuilder from "./ecs-query-builder";
import type { ComponentFilterTuple, ComponentInstances } from "./types";

/**
 * A self-updating query that tracks all entities that match with the query's
 *  component filters.
 */
export class EcsQuery<TFilter extends ComponentFilterTuple> {
  private readonly builder: EcsQueryBuilder<TFilter>;

  public constructor(builder: EcsQueryBuilder<TFilter>) {
    this.builder = builder;
  }

  /**
   * Get the components of the query's entities.
   */
  public *[Symbol.iterator](): IterableIterator<ComponentInstances<TFilter>> {
    for (const entity of this.builder) {
      yield this.getComponents(entity);
    }
  }

  /**
   * Get the query entities and their components.
   */
  public *withEntities(): IterableIterator<
    [EcsEntity, ...ComponentInstances<TFilter>]
  > {
    for (const entity of this.builder) {
      yield [entity, ...this.getComponents(entity)];
    }
  }

  /**
   * Get only the entities in the query.
   */
  public *asEntities(): IterableIterator<EcsEntity> {
    yield* this.builder;
  }

  /**
   * Check if a given entity is in the query.
   *
   * @param entity - The entity to check for
   * @returns `true` if the entity is in the query
   */
  public has(entity: EcsEntity): boolean {
    return this.builder.has(entity);
  }

  /**
   * Get the number of entities in the query.
   */
  public get size(): number {
    return this.builder.size;
  }

  /**
   * Retrieves the component instances from a given entity.
   *
   * @internal
   * @param entity - The entity to get the components from
   * @returns The component instances of that entity
   */
  private getComponents(entity: EcsEntity): ComponentInstances<TFilter> {
    return this.builder.components.map((component) =>
      entity.get(component)
    ) as ComponentInstances<TFilter>;
  }
}
