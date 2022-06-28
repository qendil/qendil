import type { EntityQuery } from "./entity-query";
import type { ComponentFilterTuple } from "./types";

/**
 * A tool for controlling behavior in an ECS application.
 *
 * Systems operate on all entities of a given Component filter.
 */
export default class GameSystem<
  TFilter extends ComponentFilterTuple,
  TArgs extends unknown[],
  TResult
> {
  public readonly filters: TFilter;
  public readonly handle: (
    query: EntityQuery<TFilter>,
    ...args: TArgs
  ) => TResult;

  public constructor(
    filter: TFilter,
    handler: (query: EntityQuery<TFilter>, ...args: TArgs) => TResult
  ) {
    this.filters = filter;
    this.handle = handler;
  }
}

/**
 * A handle to invoke a game system or to dispose it.
 */
export type GameSystemHandle<TArgs extends unknown[], TResult> = {
  (...args: TArgs): TResult;

  /**
   * Disposes of the system, removing all internal references to it.
   */
  dispose: () => void;
};
