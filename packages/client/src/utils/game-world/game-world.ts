import { SetMap } from "../default-map";
import EntityQueryBuilder from "./entity-query-builder";
import { GameEntity } from "./game-entity";
import { GameComponentFilterObject } from "./game-component";

import type {
  GameComponentConstructor,
  GameComponentFilter,
} from "./game-component";
import type { GameEntityLifecycleHooks } from "./game-entity";
import type { EntityQuery } from "./entity-query";
import type { GameSystem } from "./game-system";

/**
 * Unexposed wrapper that implements GameEntity
 */
class GameEntityWrapper extends GameEntity {
  public constructor(id: number, hooks: GameEntityLifecycleHooks) {
    super(id, hooks);
  }
}

/**
 * Stores and exposes operations on entities, components, and systems.
 */
export default class GameWorld {
  private nextEntityID = 0;
  private readonly entities = new Set<GameEntity>();
  private readonly queries = new SetMap<
    GameComponentConstructor,
    EntityQueryBuilder
  >();

  /**
   * Spawns a new entity in the world.
   *
   * @important You should call `dispose()` on the returned entity when you
   *  are done with it, to remove it from the world.
   *
   * @returns A new entity
   */
  public spawn(): GameEntity {
    const entity = new GameEntityWrapper(this.nextEntityID++, {
      onDispose: this._disposeEntity.bind(this),
      onComponentAdded: this._entityComponentAdded.bind(this),
      onComponentRemoved: this._entityComponentRemoved.bind(this),
      onComponentChanged: this._entityComponentChanged.bind(this),
    });

    this.entities.add(entity);

    return entity;
  }

  /**
   * Create a system that operates on entities that have all of the given
   *   components.
   *
   * @important
   *  You should call `dispose()` on the returned system when you are done.
   *
   * @param filters - List of component filters to track
   * @param callback - Callback that's called whenever the system is invoked
   *  It receives and entity set as its first argument
   *  Arguments and return value are forwarded when the system is invoked
   * @returns A system function
   */
  public watch<T extends unknown[], R>(
    filters: GameComponentFilter[],
    callback: (entities: EntityQuery, ...args: T) => R
  ): GameSystem<T, R> {
    const [query, update, dispose] = this.createQuery(...filters);

    const system: GameSystem<T, R> = (...args: T): R => {
      const result = callback(query, ...args);
      update();
      return result;
    };

    system.dispose = (): void => {
      dispose();
    };

    return system;
  }

  /**
   * Called by the entity when it is disposed,
   * to remove it from the internal collection.
   *
   * @internal
   * @param entity - The entity to dispose of
   */
  private _disposeEntity(entity: GameEntity): void {
    for (const component of entity.getComponents()) {
      const queries = this.queries.get(component);

      for (const builder of queries) {
        builder.delete(entity);
      }
    }

    this.entities.delete(entity);
  }

  /**
   * Get the component referenced by a given filter.
   *
   * @internal
   * @param filter - The filter to get the component of
   * @returns The component referenced by the filter
   */
  private _getFilterComponent(
    filter: GameComponentFilter
  ): GameComponentConstructor {
    return filter instanceof GameComponentFilterObject
      ? filter.component
      : filter;
  }

  /**
   * Create a query builder for the given filters.
   *
   * @internal
   * @param filters - List of component filters to track
   * @returns a query, a function to update the query,
   *  and a function to dispose it
   */
  private createQuery(
    ...filters: GameComponentFilter[]
  ): [EntityQuery, () => void, () => void] {
    const builder = new EntityQueryBuilder(
      filters,
      this.entities,
      this._disposeQueryBuilder.bind(this)
    );

    // Add this query to all query sets related to the component
    for (const queryFilter of filters) {
      const filterComponent = this._getFilterComponent(queryFilter);
      this.queries.get(filterComponent).add(builder);
    }

    return builder.wrap();
  }

  /**
   * Disposes a query builder and removes it from internal query sets.
   *
   * @internal
   * @param builder - The query builder to dispose of
   */
  private _disposeQueryBuilder(builder: EntityQueryBuilder): void {
    for (const filter of builder.filters) {
      const filterComponent = this._getFilterComponent(filter);
      this.queries.get(filterComponent).delete(builder);
    }
  }

  /**
   * Called when a component is added to an entity.
   *
   * @internal
   * @param entity - The entity that received a new component
   * @param component - The component that was added to the entity
   */
  private _entityComponentAdded(
    entity: GameEntity,
    component: GameComponentConstructor
  ): void {
    const queries = this.queries.get(component);

    for (const builder of queries) {
      builder._onEntityComponentAdded(entity, component);
    }
  }

  /**
   * Called when a component is changed on an entity.
   *
   * @internal
   * @param entity - The entity whose component changed
   * @param component - The component that changed
   */
  private _entityComponentChanged(
    entity: GameEntity,
    component: GameComponentConstructor
  ): void {
    const queries = this.queries.get(component);

    for (const builder of queries) {
      builder._onEntityComponentChanged(entity, component);
    }
  }

  /**
   * Called when a component is removed from an entity.
   *
   * @internal
   * @param entity - The entity whose component was removed
   * @param component - The component that was removed
   */
  private _entityComponentRemoved(
    entity: GameEntity,
    component: GameComponentConstructor
  ): void {
    const queries = this.queries.get(component);

    for (const builder of queries) {
      builder._onEntityComponentRemoved(entity, component);
    }
  }
}
