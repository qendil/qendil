import EcsResourceManager from "./ecs-resource-manager";
import EcsResourceQuery from "./ecs-resource-query";
import EcsQueryBuilder from "./ecs-query-builder";
import { EcsResourceFilterObject } from "./ecs-resource";
import { makeSystemRunner } from "./ecs-system-runner";
import { EcsFilterObject } from "./ecs-component";
import { EcsEntity } from "./ecs-entity";
import { SetMap } from "../default-map";

import type {
  EcsComponentConstructor,
  EcsComponentFilter,
} from "./ecs-component";
import type {
  default as EcsSystem,
  EcsSystemHandle,
  EcsCommand,
  SystemQuery,
  SystemQueryResult,
} from "./ecs-system";
import type { EcsQuery } from "./ecs-query";
import type { EcsSystemRunner } from "./ecs-system-runner";
import type { EcsResourceConstructor } from "./ecs-resource";
import type { ComponentFilterTuple, ResourceFilterTuple } from "./types";

/**
 * Stores and exposes operations on entities, components, and systems.
 */
export default class EcsManager {
  private nextEntityID = 0;
  private disposed = false;
  private readonly entities = new Set<EcsEntity>();

  private readonly entityQueries = new SetMap<
    EcsComponentConstructor,
    EcsQueryBuilder<any>
  >();

  private readonly resourceQueries = new SetMap<
    EcsResourceConstructor,
    EcsResourceQuery<any>
  >();

  public readonly resources = new EcsResourceManager({
    onResourceChanged: this._resourceChanged.bind(this),
  });

  /**
   * Disposes of the world and all its entities, components and systems.
   */
  public dispose(): void {
    if (this.disposed) return;

    // Dispose of query builders
    const disposedBuilders = new Set<EcsQueryBuilder>();
    for (const builders of this.entityQueries.values()) {
      for (const builder of builders) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        if (!disposedBuilders.has(builder)) {
          builder.dispose();
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          disposedBuilders.add(builder);
        }
      }
    }

    this.entityQueries.clear();

    // Dispose of entities
    for (const entity of this.entities) {
      entity.dispose();
    }

    this.entities.clear();

    // Dispose of resources
    this.resources.dispose();

    this.disposed = true;
  }

  /**
   * Spawns a new entity in the world.
   *
   * @important You should call `dispose()` on the returned entity when you
   *  are done with it, to remove it from the world.
   *
   * @returns A new entity
   */
  public spawn(): EcsEntity {
    if (this.disposed) {
      throw new Error("Cannot spawn an entity in a disposed world.");
    }

    const entity = new EcsEntity(this.nextEntityID++, {
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
  public addSystem<T extends SystemQuery>(
    system: EcsSystem<T>
  ): EcsSystemHandle {
    const { callback, query } = system;

    if (this.disposed) {
      throw new Error("Cannot create a system in a disposed world.");
    }

    const entityQueries: Record<string, EcsQuery<ComponentFilterTuple>> = {};

    for (const key in query) {
      if (key === "command") continue;
      if (key === "resources") continue;

      const filters = query[key] as ComponentFilterTuple | undefined;
      if (filters === undefined) continue;

      const entityQuery = this.watch(...filters);
      entityQueries[key] = entityQuery;
    }

    const resourceFilters = query.resources ?? [];
    const resourceQuery = this.createResourceQuery(resourceFilters);

    const commands: EcsCommand[] = [];
    const command = (pending: EcsCommand): void => {
      commands.push(pending);
    };

    const handle: EcsSystemHandle = () => {
      const resources = resourceQuery.getResources();

      if (resources !== undefined) {
        callback({
          ...entityQueries,
          resources,
          command,
        } as SystemQueryResult<T>);
      }

      for (const pendingCommand of commands) {
        pendingCommand(this);
      }

      // Clear the commands stack
      commands.length = 0;

      for (const entityQuery of Object.values(entityQueries)) {
        entityQuery.update();
      }

      resourceQuery.update();
    };

    let disposed = false;
    handle.dispose = (): void => {
      if (disposed) return;

      for (const entityQuery of Object.values(entityQueries)) {
        entityQuery.dispose();
      }

      resourceQuery.dispose();

      disposed = true;
    };

    return handle;
  }

  /**
   * Called by the entity when it is disposed,
   * to remove it from the internal collection.
   *
   * @internal
   * @param entity - The entity to dispose of
   */
  private _disposeEntity(entity: EcsEntity): void {
    for (const component of entity.getComponents()) {
      const queries = this.entityQueries.get(component);

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
    filter: EcsComponentFilter
  ): EcsComponentConstructor {
    return filter instanceof EcsFilterObject ? filter.component : filter;
  }

  /**
   * Create a query builder for the given filters.
   *
   * @internal
   * @param filters - List of component filters to track
   * @returns a query builder
   */
  private createEntityQuery<TFilter extends ComponentFilterTuple>(
    filters: TFilter
  ): EcsQueryBuilder<TFilter> {
    const builder = new EcsQueryBuilder<TFilter>(
      filters,
      this.entities,
      this._disposeQueryBuilder.bind(this)
    );

    // Add this query to all query sets related to the component
    for (const queryFilter of filters) {
      const filterComponent = this._getFilterComponent(queryFilter);
      this.entityQueries.get(filterComponent).add(builder);
    }

    return builder;
  }

  /**
   * Create an entity query object for the given filters.
   *
   * @param filters - List of component filters to track
   * @returns a query object
   */
  public watch<TFilter extends ComponentFilterTuple>(
    ...filters: TFilter
  ): EcsQuery<TFilter> {
    return this.createEntityQuery(filters).wrap();
  }

  /**
   * Disposes a query builder and removes it from internal query sets.
   *
   * @internal
   * @param builder - The query builder to dispose of
   */
  private _disposeQueryBuilder<TFilter extends ComponentFilterTuple>(
    builder: EcsQueryBuilder<TFilter>
  ): void {
    for (const filter of builder.filters) {
      const filterComponent = this._getFilterComponent(filter);
      this.entityQueries.get(filterComponent).delete(builder);
    }
  }

  /**
   * Create a resource query for the given resource filters.
   *
   * @internal
   * @param filters - List of resource filters to track
   * @return a query, a function to update the query,
   *  and a function to dispose it
   */
  private createResourceQuery<TResourceFilter extends ResourceFilterTuple>(
    filters: TResourceFilter
  ): EcsResourceQuery<TResourceFilter> {
    const query = new EcsResourceQuery(
      filters,
      this.resources,
      this._disposeResourceQuery.bind(this)
    );

    // Add this query to all query sets related to the component
    for (const queryFilter of filters) {
      if (queryFilter instanceof EcsResourceFilterObject) {
        this.resourceQueries.get(queryFilter.resource).add(query);
      }
    }

    return query;
  }

  /**
   * Disposes of a resource query and removes it from internal query sets.
   *
   * @internal
   * @param query - The query to dispose of
   */
  private _disposeResourceQuery<TResourceFilter extends ResourceFilterTuple>(
    query: EcsResourceQuery<TResourceFilter>
  ): void {
    for (const filter of query.filters) {
      if (filter instanceof EcsResourceFilterObject) {
        this.resourceQueries.get(filter.resource).delete(query);
      }
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
    entity: EcsEntity,
    component: EcsComponentConstructor
  ): void {
    const queries = this.entityQueries.get(component);

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
    entity: EcsEntity,
    component: EcsComponentConstructor
  ): void {
    const queries = this.entityQueries.get(component);

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
    entity: EcsEntity,
    component: EcsComponentConstructor
  ): void {
    const queries = this.entityQueries.get(component);

    for (const builder of queries) {
      builder._onEntityComponentRemoved(entity, component);
    }
  }

  /**
   * Called when a resource is changed.
   *
   * @internal
   * @param constructor - The constructor of the entity that changed
   */
  private _resourceChanged(constructor: EcsResourceConstructor): void {
    const queries = this.resourceQueries.get(constructor);

    for (const query of queries) {
      query._onResourceChanged(constructor);
    }
  }

  /**
   * Add a system runner.
   *
   * @returns an ECS systems runner.
   */
  public addRunner(): EcsSystemRunner {
    return makeSystemRunner(this);
  }
}
