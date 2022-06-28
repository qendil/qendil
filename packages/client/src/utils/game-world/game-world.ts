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
import type { GameSystemHandle } from "./game-system";
import type { ComponentFilterTuple } from "./types";
import type GameSystem from "./game-system";

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
  private disposed = false;
  private readonly entities = new Set<GameEntity>();
  private readonly queries = new SetMap<
    GameComponentConstructor,
    EntityQueryBuilder<any>
  >();

  /**
   * Disposes of the world and all its entities, components and systems.
   */
  public dispose(): void {
    if (this.disposed) return;
    this.disposed = true;

    for (const entity of this.entities) {
      entity.dispose();
    }

    const disposedBuilders = new Set<EntityQueryBuilder>();
    for (const builders of this.queries.values()) {
      for (const builder of builders) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        if (!disposedBuilders.has(builder)) {
          builder.dispose();
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          disposedBuilders.add(builder);
        }
      }
    }

    this.entities.clear();
    this.queries.clear();
  }

  /**
   * Spawns a new entity in the world.
   *
   * @important You should call `dispose()` on the returned entity when you
   *  are done with it, to remove it from the world.
   *
   * @returns A new entity
   */
  public spawn(): GameEntity {
    if (this.disposed) {
      throw new Error("Cannot spawn an entity in a disposed world.");
    }

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
   * @param system - A GameSystem instance to define the system
   * @returns A system handle
   */
  public watch<
    TFilter extends ComponentFilterTuple,
    TArgs extends unknown[],
    TResult
  >(
    system: GameSystem<TFilter, TArgs, TResult>
  ): GameSystemHandle<TArgs, TResult>;

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
   * @returns A system hanlde
   */
  public watch<
    TFilter extends ComponentFilterTuple,
    TArgs extends unknown[],
    TResult
  >(
    filters: TFilter,
    callback: (entities: EntityQuery<TFilter>, ...args: TArgs) => TResult
  ): GameSystemHandle<TArgs, TResult>;

  /**
   * Create a system that operates on entities that have all of the given
   *   components.
   *
   * @important
   *  You should call `dispose()` on the returned system when you are done.
   *
   * @param filtersOrSystem - A filter or a GameSystem instance
   * @param callback - Callback that's called whenever the system is invoked
   *  It receives and entity set as its first argument
   *  Arguments and return value are forwarded when the system is invoked
   * @returns A system handle
   */
  public watch<
    TFilter extends ComponentFilterTuple,
    TArgs extends unknown[],
    TResult
  >(
    filtersOrSystem: GameSystem<TFilter, TArgs, TResult> | TFilter,
    callback?: (entities: EntityQuery<TFilter>, ...args: TArgs) => TResult
  ): GameSystemHandle<TArgs, TResult> {
    if (!Array.isArray(filtersOrSystem)) {
      const { filters, handle } = filtersOrSystem;
      return this.watch(filters, handle);
    }

    if (this.disposed) {
      throw new Error("Cannot create a system in a disposed world.");
    }

    const [query, update, dispose] = this.createQuery(...filtersOrSystem);
    let disposed = false;

    const system: GameSystemHandle<TArgs, TResult> = (...args) => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const result = callback!(query, ...args);
      update();
      return result;
    };

    system.dispose = (): void => {
      if (disposed) return;

      disposed = true;
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
  private createQuery<TFilter extends ComponentFilterTuple>(
    ...filters: TFilter
  ): [EntityQuery<TFilter>, () => void, () => void] {
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
  private _disposeQueryBuilder<TFilter extends ComponentFilterTuple>(
    builder: EntityQueryBuilder<TFilter>
  ): void {
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
