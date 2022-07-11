import type { EcsQuery } from "./ecs-query";
import type {
  ComponentFilterTuple,
  ResourceFilterTuple,
  ResourceInstances,
} from "./types";

export type SystemQuery<
  TFilter extends ComponentFilterTuple,
  TResourceFilter extends ResourceFilterTuple
> = {
  entities?: TFilter;
  resources?: TResourceFilter;
};

export type SystemQueryResult<
  TFilter extends ComponentFilterTuple,
  TResourceFilter extends ResourceFilterTuple
> = {
  entities: EcsQuery<TFilter>;
  resources: ResourceInstances<TResourceFilter>;
};

/**
 * A tool for controlling behavior in an ECS application.
 *
 * Systems operate on all entities of a given Component filter.
 */
export default class EcsSystem<
  TFilter extends ComponentFilterTuple,
  TResourceFilter extends ResourceFilterTuple
> {
  public readonly query: SystemQuery<TFilter, TResourceFilter>;
  public readonly handle: (
    query: SystemQueryResult<TFilter, TResourceFilter>
  ) => void;

  public constructor(
    handler: (query: SystemQueryResult<TFilter, TResourceFilter>) => void,
    query: SystemQuery<TFilter, TResourceFilter> | TFilter
  ) {
    this.query = Array.isArray(query) ? { entities: query } : query;

    this.handle = handler;
  }
}

/**
 * A handle to invoke a game system or to dispose it.
 */
export type EcsSystemHandle = {
  (): void;

  /**
   * Disposes of the system, removing all internal references to it.
   */
  dispose: () => void;
};
