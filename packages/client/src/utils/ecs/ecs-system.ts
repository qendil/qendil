import type { EcsQuery } from "./ecs-query";
import type { ComponentFilterTuple } from "./types";

export type SystemQuery<TFilter extends ComponentFilterTuple> = {
  entities: TFilter;
};

export type SystemQueryResult<TFilter extends ComponentFilterTuple> = {
  entities: EcsQuery<TFilter>;
};

/**
 * A tool for controlling behavior in an ECS application.
 *
 * Systems operate on all entities of a given Component filter.
 */
export default class EcsSystem<
  TFilter extends ComponentFilterTuple,
  TArgs extends unknown[],
  TResult
> {
  public readonly query: SystemQuery<TFilter>;
  public readonly handle: (
    query: SystemQueryResult<TFilter>,
    ...args: TArgs
  ) => TResult;

  public constructor(
    handler: (query: SystemQueryResult<TFilter>, ...args: TArgs) => TResult,
    query: SystemQuery<TFilter> | TFilter
  ) {
    this.query = Array.isArray(query) ? { entities: query } : query;

    this.handle = handler;
  }
}

/**
 * A handle to invoke a game system or to dispose it.
 */
export type EcsSystemHandle<TArgs extends unknown[], TResult> = {
  (...args: TArgs): TResult;

  /**
   * Disposes of the system, removing all internal references to it.
   */
  dispose: () => void;
};
