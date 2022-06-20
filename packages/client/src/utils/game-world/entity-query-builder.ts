import { GameComponentFilterObject } from "./game-component";
import { SetMap } from "../default-map";

import type { GameEntity } from "./game-world";
import type {
  GameComponentConstructor,
  GameComponentFilter,
} from "./game-component";
import { EntityQuery } from "./entity-query";

export default class EntityQueryBuilder extends Set<GameEntity> {
  public readonly filters: GameComponentFilter[];

  private readonly requiredComponents = new Set<GameComponentConstructor>();
  private readonly addedComponents = new Set<GameComponentConstructor>();
  private readonly changedComponents = new Set<GameComponentConstructor>();
  private readonly excludedComponents = new Set<GameComponentConstructor>();
  private readonly inclusiveFilters = new Set<GameComponentConstructor>();

  private readonly componentAddedEntities = new SetMap<
    GameEntity,
    GameComponentConstructor
  >();

  private readonly componentChangedEntities = new SetMap<
    GameEntity,
    GameComponentConstructor
  >();

  private readonly onDispose: (query: EntityQueryBuilder) => void;

  public constructor(
    components: GameComponentFilter[],
    currentEntities: Iterable<GameEntity>,
    onDispose: (query: EntityQueryBuilder) => void
  ) {
    super();

    this.filters = components;
    this.onDispose = onDispose;

    for (const filter of this.filters) {
      if (filter instanceof GameComponentFilterObject) {
        const { operation, component } = filter;

        switch (operation) {
          case "less":
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

          // No default
        }
      } else {
        this.requiredComponents.add(filter);
        this.inclusiveFilters.add(filter);
      }
    }

    for (const entity of currentEntities) {
      // Check if it's excluded
      if (entity.hasAny(this.excludedComponents)) {
        continue;
      }

      // Check if it's included
      if (!entity.hasAll(this.inclusiveFilters)) {
        continue;
      }

      this.add(entity);
    }
  }

  public dispose(): void {
    this.onDispose(this);
  }

  public wrap(): [EntityQuery, () => void] {
    const query = new EntityQuery(this, this.dispose.bind(this));

    const update = this.update.bind(this);

    return [query, update];
  }

  public update(): void {
    if (this.addedComponents.size > 0 || this.changedComponents.size > 0) {
      this.clear();
    }

    this.componentAddedEntities.clear();
    this.componentChangedEntities.clear();
  }

  public _onEntityComponentAdded(
    entity: GameEntity,
    component: GameComponentConstructor
  ): void {
    const componentsAdded = this.componentAddedEntities.get(entity);
    let componentsAddedCleared =
      this.addedComponents.size === 0 ||
      componentsAdded.size === this.addedComponents.size;

    if (!componentsAddedCleared) {
      if (this.addedComponents.has(component)) {
        componentsAdded.add(component);
      }

      if (componentsAdded.size === this.addedComponents.size) {
        componentsAddedCleared = true;
      }
    }

    const componentsChanged = this.componentChangedEntities.get(entity);
    let componentsChangedCleared =
      this.changedComponents.size === 0 ||
      componentsChanged.size === this.changedComponents.size;

    if (!componentsChangedCleared) {
      if (this.changedComponents.has(component)) {
        componentsChanged.add(component);
      }

      if (componentsChanged.size === this.changedComponents.size) {
        componentsChangedCleared = true;
      }
    }

    if (entity.hasAny(this.excludedComponents)) {
      this.delete(entity);
    } else if (
      componentsAddedCleared &&
      componentsChangedCleared &&
      entity.hasAll(this.requiredComponents)
    ) {
      this.add(entity);
    }
  }

  public _onEntityComponentRemoved(
    entity: GameEntity,
    component: GameComponentConstructor
  ): void {
    if (this.addedComponents.has(component)) {
      this.componentAddedEntities.delete(entity);
    }

    if (this.changedComponents.has(component)) {
      this.componentChangedEntities.delete(entity);
    }

    // If this component was in any of the inclusive filters
    // Remove the entity immediatly and return
    if (this.inclusiveFilters.has(component)) {
      this.delete(entity);
      return;
    }

    if (entity.hasAny(this.excludedComponents)) {
      return;
    }

    const componentsAdded = this.componentAddedEntities.get(entity);
    const componentsAddedCleared =
      this.addedComponents.size === 0 ||
      componentsAdded.size === this.addedComponents.size;

    const componentsChanged = this.componentChangedEntities.get(entity);
    const componentsChangedCleared =
      this.changedComponents.size === 0 ||
      componentsChanged.size === this.changedComponents.size;

    if (
      componentsAddedCleared &&
      componentsChangedCleared &&
      entity.hasAll(this.requiredComponents)
    ) {
      this.add(entity);
    }
  }

  public _onEntityComponentChanged(
    entity: GameEntity,
    component: GameComponentConstructor
  ): void {
    const componentsChanged = this.componentChangedEntities.get(entity);
    let componentsChangedCleared =
      this.changedComponents.size === 0 ||
      componentsChanged.size === this.changedComponents.size;

    if (!componentsChangedCleared) {
      if (this.changedComponents.has(component)) {
        componentsChanged.add(component);
      }

      if (componentsChanged.size === this.changedComponents.size) {
        componentsChangedCleared = true;
      }
    }

    const componentsAdded = this.componentAddedEntities.get(entity);
    const componentsAddedCleared =
      this.addedComponents.size === 0 ||
      componentsAdded.size === this.addedComponents.size;

    if (entity.hasAny(this.excludedComponents)) {
      this.delete(entity);
      return;
    }

    if (
      componentsAddedCleared &&
      componentsChangedCleared &&
      entity.hasAll(this.requiredComponents)
    ) {
      this.add(entity);
    }
  }
}
