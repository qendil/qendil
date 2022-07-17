import DefaultMap, { SetMap } from "../default-map";
import { EcsFilterObject } from "./ecs-component";
import { EcsQuery } from "./ecs-query";

import type {
  EcsComponentConstructor,
  EcsComponentFilter,
} from "./ecs-component";
import type { EcsEntity } from "./ecs-entity";
import type { ComponentFilterTuple, ComponentTuple } from "./types";

/**
 * Builds and maintains a query of component filters.
 */
export default class EcsQueryBuilder<
  TFilter extends ComponentFilterTuple = EcsComponentFilter[]
> extends Set<EcsEntity> {
  public readonly filters: TFilter;
  public readonly components: ComponentTuple<TFilter>;

  private readonly operations = new SetMap<string, EcsComponentConstructor>();

  private readonly tracked = new DefaultMap<
    string,
    SetMap<EcsEntity, EcsComponentConstructor>
  >(() => new SetMap<EcsEntity, EcsComponentConstructor>());

  /**
   * A union of required, added and changed components.
   */
  private readonly inclusiveFilters: Set<EcsComponentConstructor>;

  /**
   * Hook to call when disposing the query builder.
   */
  private readonly onDispose: (query: EcsQueryBuilder<TFilter>) => void;

  public constructor(
    filters: TFilter,
    currentEntities: Iterable<EcsEntity>,
    onDispose: (query: EcsQueryBuilder<TFilter>) => void
  ) {
    super();

    this.filters = filters;
    this.onDispose = onDispose;

    const { operations } = this;

    // Build utility sets to make querying faster later on
    const components: EcsComponentConstructor[] = [];

    for (const filter of this.filters) {
      if (filter instanceof EcsFilterObject) {
        const { operation, component } = filter;
        operations.get(operation).add(component);
      } else {
        components.push(filter);
        operations.get("present").add(filter);
      }
    }

    this.components = components as ComponentTuple<TFilter>;

    // Build the set of inclusive filters
    this.inclusiveFilters = new Set([
      ...operations.get("present"),
      ...operations.get("added"),
      ...operations.get("changed"),
    ]);
    const { inclusiveFilters } = this;

    // Build the initial set of entities matched by this query
    for (const entity of currentEntities) {
      // Exclude entities that have any of the excluded components
      if (entity.hasAny(operations.get("absent"))) {
        continue;
      }

      // Exclude entities that don't have ALL the inclusive filters
      if (!entity.hasAll(inclusiveFilters)) {
        continue;
      }

      this.add(entity);
    }
  }

  /**
   * Disposes the query builder.
   */
  public dispose(): void {
    this.onDispose(this);
  }

  /**
   * Wraps the builder into an EntityQuery that has less exposed methods,
   *  to prevent the user from breaking the builder's state.
   *
   * @returns An EntityQuery, a function to signal an update,
   *  and a function to dispose it
   */
  public wrap(): EcsQuery<TFilter> {
    return new EcsQuery(this);
  }

  /**
   * Signal an update to the query. This tells it that the system was called,
   *  and that the query should start monitoring a new set of added and changed
   *  components.
   */
  public update(): void {
    // This only affect queries that track -added and -changed components.
    if (
      this.operations.get("added").size === 0 &&
      this.operations.get("changed").size === 0
    ) {
      return;
    }

    // No component matches the query anymore.
    this.clear();

    // Reset the sets used to monitor which components were added and changed
    // since last update.
    this.tracked.clear();
  }

  /**
   * Called when a component is added to an entity.
   *
   * @internal
   * @param entity - The affected entity
   * @param component - The component that was added
   */
  public _onEntityComponentAdded(
    entity: EcsEntity,
    component: EcsComponentConstructor
  ): void {
    const { operations, tracked } = this;

    const addedComponents = operations.get("added");
    const changedComponents = operations.get("changed");
    const excludedComponents = operations.get("absent");
    const requiredComponents = operations.get("present");

    const trackedAdded = tracked.get("added");
    const trackedChanged = tracked.get("changed");

    // If the query monitors -added components, add the entity
    // to the set of entities that have a relevant component added.
    const addedEntities = trackedAdded.get(entity);
    let addedOk =
      addedComponents.size === 0 || addedEntities.size === addedComponents.size;

    if (!addedOk) {
      if (addedComponents.has(component)) {
        addedEntities.add(component);
      }

      addedOk = addedEntities.size === addedComponents.size;
    }

    // If the query monitors -changed components, Add the entity
    // to the set of entities that have a relevant component changed.
    const changedEntities = trackedChanged.get(entity);
    let changedOk =
      changedComponents.size === 0 ||
      changedEntities.size === changedComponents.size;

    if (!changedOk) {
      if (changedComponents.has(component)) {
        changedEntities.add(component);
      }

      changedOk = changedEntities.size === changedComponents.size;
    }

    if (entity.hasAny(excludedComponents)) {
      // The entity has a component that is excluded by the query. Remove it.
      this.delete(entity);
    } else if (addedOk && changedOk && entity.hasAll(requiredComponents)) {
      // The entity has all the required components. Add it.
      this.add(entity);
    }
  }

  /**
   * Called when an entity had a component removed.
   *
   * @internal
   * @param entity - The entity to check
   * @param component - The component that was removed
   */
  public _onEntityComponentRemoved(
    entity: EcsEntity,
    component: EcsComponentConstructor
  ): void {
    const { operations, tracked, inclusiveFilters } = this;

    const addedComponents = operations.get("added");
    const changedComponents = operations.get("changed");
    const excludedComponents = operations.get("absent");
    const requiredComponents = operations.get("present");

    const trackedAdded = tracked.get("added");
    const trackedChanged = tracked.get("changed");

    // If this component was in any of the inclusive filters
    // Remove the entity immediatly and return
    if (inclusiveFilters.has(component)) {
      // If the component was in the -added set, remove it from the set
      if (addedComponents.has(component)) {
        trackedAdded.delete(entity);
      }

      // If the component was in the -changed set, remove it from the set
      if (changedComponents.has(component)) {
        trackedChanged.delete(entity);
      }

      this.delete(entity);
      return;
    }

    // If the entity has any of the excluded components, then don't bother
    // with the rest of the checks.
    if (entity.hasAny(excludedComponents)) return;

    // Make sure it all the -added components are there, if they're monitored.
    const addedOk =
      addedComponents.size === 0 ||
      trackedAdded.get(entity).size === addedComponents.size;

    // Make sure it all the -changed components are there, if they're monitored.
    const changedOk =
      changedComponents.size === 0 ||
      trackedChanged.get(entity).size === changedComponents.size;

    // If the entity has all the required components, add it.
    if (addedOk && changedOk && entity.hasAll(requiredComponents)) {
      this.add(entity);
    }
  }

  /**
   * Called when an entity had a component changed.
   *
   * @internal
   * @param entity - The entity to check
   * @param component - The component that was changed
   */
  public _onEntityComponentChanged(
    entity: EcsEntity,
    component: EcsComponentConstructor
  ): void {
    if (this.has(entity)) return;

    const { operations, tracked } = this;

    const addedComponents = operations.get("added");
    const changedComponents = operations.get("changed");
    const excludedComponents = operations.get("absent");
    const requiredComponents = operations.get("present");

    const trackedAdded = tracked.get("added");
    const trackedChanged = tracked.get("changed");

    // If the query monitors -changed components, Add the entity
    // to the set of entities that have a relevant component changed.
    const changedEntities = trackedChanged.get(entity);
    let changedOk =
      changedComponents.size === 0 ||
      changedEntities.size === changedComponents.size;

    if (!changedOk) {
      if (changedComponents.has(component)) {
        changedEntities.add(component);
      }

      changedOk = changedEntities.size === changedComponents.size;
    }

    // If the component has any of the excluded components, removed and return
    if (entity.hasAny(excludedComponents)) {
      this.delete(entity);
      return;
    }

    // Make sure it all the -added components are there, if they're monitored.
    const addedOk =
      addedComponents.size === 0 ||
      trackedAdded.get(entity).size === addedComponents.size;

    if (addedOk && changedOk && entity.hasAll(requiredComponents)) {
      this.add(entity);
    }
  }
}
