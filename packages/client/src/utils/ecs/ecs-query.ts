import type { EcsEntity } from "./ecs-entity";
import type {
  ComponentFilterTuple,
  ComponentInstances,
  ComponentTuple,
} from "./types";

/**
 * A self-updating query that tracks all entities that match with the query's
 *  component filters.
 */
export abstract class EcsQuery<TFilter extends ComponentFilterTuple> {
  protected readonly entities: Set<EcsEntity>;
  protected readonly components: ComponentTuple<TFilter>;

  protected constructor(
    entities: Set<EcsEntity>,
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
      yield this.getComponents(entity);
    }
  }

  /**
   * Get the query entities and their components.
   */
  public *withEntities(): IterableIterator<
    [EcsEntity, ...ComponentInstances<TFilter>]
  > {
    for (const entity of this.entities) {
      yield [entity, ...this.getComponents(entity)];
    }
  }

  /**
   * Get only the entities in the query.
   */
  public *asEntities(): IterableIterator<EcsEntity> {
    yield* this.entities;
  }

  /**
   * Check if a given entity is in the query.
   *
   * @param entity - The entity to check for
   * @returns `true` if the entity is in the query
   */
  public has(entity: EcsEntity): boolean {
    return this.entities.has(entity);
  }

  /**
   * Get the number of entities in the query.
   */
  public get size(): number {
    return this.entities.size;
  }

  /**
   * Retrieves the component instances from a given entity.
   *
   * @internal
   * @param entity - The entity to get the components from
   * @returns The component instances of that entity
   */
  private getComponents(entity: EcsEntity): ComponentInstances<TFilter> {
    return this.components.map((component) =>
      entity.get(component)
    ) as ComponentInstances<TFilter>;
  }
}
