import { SetMap } from "../default-map";
import { EcsFilterObject } from "./ecs-component";
import { EcsQuery } from "./ecs-query";

import type {
  EcsComponentConstructor,
  EcsComponentFilter,
} from "./ecs-component";
import type { EcsEntity } from "./ecs-entity";
import type { ComponentFilterTuple, ComponentTuple } from "./types";

/**
 * Internal wrapper over the EntityQuery wrapper
 */
class EntityQueryWrapper<
  TFilter extends ComponentFilterTuple
> extends EcsQuery<TFilter> {
  public constructor(
    entities: Set<EcsEntity>,
    components: ComponentTuple<TFilter>
  ) {
    super(entities, components);
  }
}

/**
 * Builds and maintains a query of component filters.
 */
export default class EntityQueryBuilder<
  TFilter extends ComponentFilterTuple = EcsComponentFilter[]
> extends Set<EcsEntity> {
  public readonly filters: TFilter;
  public readonly components: ComponentTuple<TFilter>;

  /**
   * The components that are required in an entity.
   */
  private readonly requiredComponents = new Set<EcsComponentConstructor>();

  /**
   * The components that need to be added since the last update.
   */
  private readonly addedComponents = new Set<EcsComponentConstructor>();

  /**
   * The components that need to be changed since the last update.
   */
  private readonly changedComponents = new Set<EcsComponentConstructor>();

  /**
   * The components that need to be absent in an entity.
   */
  private readonly excludedComponents = new Set<EcsComponentConstructor>();

  /**
   * A union of required, added and changed components.
   */
  private readonly inclusiveFilters = new Set<EcsComponentConstructor>();

  /**
   * Tracks the entities that had a relevant component added to them
   *  since last update.
   */
  private readonly componentAddedEntities = new SetMap<
    EcsEntity,
    EcsComponentConstructor
  >();

  /**
   * Tracks entities that had a relevant component changed since last update.
   */
  private readonly componentChangedEntities = new SetMap<
    EcsEntity,
    EcsComponentConstructor
  >();

  /**
   * Hook to call when disposing the query builder.
   */
  private readonly onDispose: (query: EntityQueryBuilder<TFilter>) => void;

  public constructor(
    filters: TFilter,
    currentEntities: Iterable<EcsEntity>,
    onDispose: (query: EntityQueryBuilder<TFilter>) => void
  ) {
    super();

    this.filters = filters;
    this.onDispose = onDispose;

    const components: EcsComponentConstructor[] = [];

    // Build utility sets to make querying faster later on
    for (const filter of this.filters) {
      if (filter instanceof EcsFilterObject) {
        const { operation, component } = filter;

        switch (operation) {
          case "absent":
            this.excludedComponents.add(component);
            break;

          case "added":
            this.addedComponents.add(component);
            this.inclusiveFilters.add(component);
            break;

          case "changed":
            this.changedComponents.add(component);
            this.inclusiveFilters.add(component);
            break;

          case "present":
            this.requiredComponents.add(component);
            this.inclusiveFilters.add(component);

          // No default
        }
      } else {
        this.requiredComponents.add(filter);
        this.inclusiveFilters.add(filter);

        components.push(filter);
      }
    }

    this.components = components as ComponentTuple<TFilter>;

    // Build the initial set of entities matched by this query
    for (const entity of currentEntities) {
      if (entity.hasAny(this.excludedComponents)) continue;
      if (!entity.hasAll(this.inclusiveFilters)) continue;

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
    return new EntityQueryWrapper(this, this.components);
  }

  /**
   * Signal an update to the query. This tells it that the system was called,
   *  and that the query should start monitoring a new set of added and changed
   *  components.
   */
  public update(): void {
    // This only affect queries that track -added and -changed components.
    if (this.addedComponents.size === 0 && this.changedComponents.size === 0) {
      return;
    }

    // No component matches the query anymore.
    this.clear();

    // Reset the sets used to monitor which components were added and changed
    // since last update.
    this.componentAddedEntities.clear();
    this.componentChangedEntities.clear();
  }

  /**
   * Called when a component is added to an entity.
   *
   * @param entity - The affected entity
   * @param component - The component that was added
   */
  public _onEntityComponentAdded(
    entity: EcsEntity,
    component: EcsComponentConstructor
  ): void {
    const {
      addedComponents,
      changedComponents,
      componentAddedEntities,
      componentChangedEntities,
      excludedComponents,
      requiredComponents,
    } = this;

    // If the query monitors -added components, add the entity
    // to the set of entities that have a relevant component added.
    const addedEntities = componentAddedEntities.get(entity);
    let componentsAddedSatisfied =
      addedComponents.size === 0 || addedEntities.size === addedComponents.size;

    if (!componentsAddedSatisfied) {
      if (addedComponents.has(component)) {
        addedEntities.add(component);
      }

      if (addedEntities.size === addedComponents.size) {
        componentsAddedSatisfied = true;
      }
    }

    // If the query monitors -changed components, Add the entity
    // to the set of entities that have a relevant component changed.
    const changedEntities = componentChangedEntities.get(entity);
    let componentsChangedSatisfied =
      changedComponents.size === 0 ||
      changedEntities.size === changedComponents.size;

    if (!componentsChangedSatisfied) {
      if (changedComponents.has(component)) {
        changedEntities.add(component);
      }

      if (changedEntities.size === changedComponents.size) {
        componentsChangedSatisfied = true;
      }
    }

    if (entity.hasAny(excludedComponents)) {
      // The entity has a component that is excluded by the query. Remove it.
      this.delete(entity);
    } else if (
      componentsAddedSatisfied &&
      componentsChangedSatisfied &&
      entity.hasAll(requiredComponents)
    ) {
      // The entity has all the required components. Add it.
      this.add(entity);
    }
  }

  /**
   * Called when an entity had a component removed.
   *
   * @param entity - The entity to check
   * @param component - The component that was removed
   */
  public _onEntityComponentRemoved(
    entity: EcsEntity,
    component: EcsComponentConstructor
  ): void {
    const {
      addedComponents,
      changedComponents,
      componentAddedEntities,
      componentChangedEntities,
      excludedComponents,
      requiredComponents,
      inclusiveFilters,
    } = this;

    // If this component was in any of the inclusive filters
    // Remove the entity immediatly and return
    if (inclusiveFilters.has(component)) {
      // If the component was in the -added set, remove it from the set
      if (addedComponents.has(component)) {
        componentAddedEntities.delete(entity);
      }

      // If the component was in the -changed set, remove it from the set
      if (changedComponents.has(component)) {
        componentChangedEntities.delete(entity);
      }

      this.delete(entity);
      return;
    }

    // If the entity has any of the excluded components, then don't bother
    // with the rest of the checks.
    if (entity.hasAny(excludedComponents)) return;

    // Make sure it all the -added components are there, if they're monitored.
    const componentsAddedSatisfied =
      addedComponents.size === 0 ||
      componentAddedEntities.get(entity).size === addedComponents.size;

    // Make sure it all the -changed components are there, if they're monitored.
    const componentsChangedSatisfied =
      changedComponents.size === 0 ||
      componentChangedEntities.get(entity).size === changedComponents.size;

    // If the entity has all the required components, add it.
    if (
      componentsAddedSatisfied &&
      componentsChangedSatisfied &&
      entity.hasAll(requiredComponents)
    ) {
      this.add(entity);
    }
  }

  /**
   * Called when an entity had a component changed.
   *
   * @param entity - The entity to check
   * @param component - The component that was changed
   */
  public _onEntityComponentChanged(
    entity: EcsEntity,
    component: EcsComponentConstructor
  ): void {
    const {
      addedComponents,
      changedComponents,
      componentAddedEntities,
      componentChangedEntities,
      excludedComponents,
      requiredComponents,
    } = this;

    // If the query monitors -changed components, Add the entity
    // to the set of entities that have a relevant component changed.
    const changedEntities = componentChangedEntities.get(entity);
    let componentsChangedSatisfied =
      changedComponents.size === 0 ||
      changedEntities.size === changedComponents.size;

    if (!componentsChangedSatisfied) {
      if (changedComponents.has(component)) {
        changedEntities.add(component);
      }

      if (changedEntities.size === changedComponents.size) {
        componentsChangedSatisfied = true;
      }
    }

    // If the component has any of the excluded components, removed and return
    if (entity.hasAny(excludedComponents)) {
      this.delete(entity);
      return;
    }

    // Make sure it all the -added components are there, if they're monitored.
    const componentsAddedSatisfied =
      addedComponents.size === 0 ||
      componentAddedEntities.get(entity).size === addedComponents.size;

    if (
      componentsAddedSatisfied &&
      componentsChangedSatisfied &&
      entity.hasAll(requiredComponents)
    ) {
      this.add(entity);
    }
  }
}
