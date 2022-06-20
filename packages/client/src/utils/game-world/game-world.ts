import EntityQueryBuilder from "./entity-query-builder";
import GameEntity from "./game-entity";
import { SetMap } from "../default-map";
import { GameComponentFilterObject } from "./game-component";

import type {
  GameComponentConstructor,
  GameComponentFilter,
} from "./game-component";
import type EntityQuery from "./entity-query";
import type GameSystem from "./game-system";
export type { default as GameEntity } from "./game-entity";

export default class GameWorld {
  private nextEntityID = 0;
  private readonly entities = new Set<GameEntity>();
  private readonly queries = new SetMap<
    GameComponentConstructor,
    EntityQueryBuilder
  >();

  public spawn(): GameEntity {
    const entity = new GameEntity(this.nextEntityID++, {
      onDispose: this._disposeEntity.bind(this),
      onComponentAdded: this._entityComponentAdded.bind(this),
      onComponentRemoved: this._entityComponentRemoved.bind(this),
      onComponentChanged: this._entityComponentChanged.bind(this),
    });

    this.entities.add(entity);

    return entity;
  }

  private _getFilterComponent(
    filter: GameComponentFilter
  ): GameComponentConstructor {
    return filter instanceof GameComponentFilterObject
      ? filter.component
      : filter;
  }

  private _disposeEntity(entity: GameEntity): void {
    for (const component of entity.getComponents()) {
      const queries = this.queries.get(component);

      for (const builder of queries) {
        builder.delete(entity);
      }
    }

    this.entities.delete(entity);
  }

  public watch<T extends unknown[], R>(
    filters: GameComponentFilter[],
    callback: (entities: EntityQuery, ...args: T) => R
  ): GameSystem<T, R> {
    const [query, update] = this.createQuery(...filters);

    const system: GameSystem<T, R> = (...args: T): R => {
      const result = callback(query, ...args);
      update();
      return result;
    };

    system.dispose = (): void => {
      query.dispose();
    };

    return system;
  }

  private createQuery(
    ...filters: GameComponentFilter[]
  ): [EntityQuery, () => void] {
    const builder = new EntityQueryBuilder(
      filters,
      this.entities,
      this._disposeQueryBuilder.bind(this)
    );

    // Add this query to all sets related to the component
    for (const queryFilter of filters) {
      const filterComponent = this._getFilterComponent(queryFilter);
      this.queries.get(filterComponent).add(builder);
    }

    return builder.wrap();
  }

  private _disposeQueryBuilder(builder: EntityQueryBuilder): void {
    for (const filter of builder.filters) {
      const filterComponent = this._getFilterComponent(filter);
      this.queries.get(filterComponent).delete(builder);
    }
  }

  private _entityComponentAdded(
    entity: GameEntity,
    component: GameComponentConstructor
  ): void {
    const queries = this.queries.get(component);

    for (const builder of queries) {
      builder._onEntityComponentAdded(entity, component);
    }
  }

  private _entityComponentChanged(
    entity: GameEntity,
    component: GameComponentConstructor
  ): void {
    const queries = this.queries.get(component);

    for (const builder of queries) {
      builder._onEntityComponentChanged(entity, component);
    }
  }

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
