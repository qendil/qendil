import type EcsManager from "./ecs-manager";
import type { EcsQuery } from "./ecs-query";
import type {
  ComponentFilterTuple,
  ResourceFilterTuple,
  ResourceInstances,
} from "./types";

/**
 * Represents a command to run on an ECS manager.
 *
 * Exposed to ECS systems and run directly after the system.
 */
export type EcsCommand = (manager: EcsManager) => void;

/**
 * An object to query entities and components for a system.
 */
export type SystemQuery<
  TFilter extends ComponentFilterTuple,
  TResourceFilter extends ResourceFilterTuple
> = {
  entities?: TFilter;
  resources?: TResourceFilter;
};

/**
 * An object with the results of a System Query.
 */
export type SystemQueryResult<
  TFilter extends ComponentFilterTuple,
  TResourceFilter extends ResourceFilterTuple
> = {
  entities: EcsQuery<TFilter>;
  resources: ResourceInstances<TResourceFilter>;
  command: (command: EcsCommand) => void;
};

/**
 * A tool for controlling behavior in an ECS application.
 *
 * Systems operate on all entities of a given Component filter.
 */
export default class EcsSystem<
  TFilter extends ComponentFilterTuple = ComponentFilterTuple,
  TResourceFilter extends ResourceFilterTuple = ResourceFilterTuple
> {
  public readonly query: SystemQuery<TFilter, TResourceFilter>;
  public readonly callback: (
    query: SystemQueryResult<TFilter, TResourceFilter>
  ) => void;

  public constructor(
    query: SystemQuery<TFilter, TResourceFilter>,
    callback: (query: SystemQueryResult<TFilter, TResourceFilter>) => void
  ) {
    this.query = query;

    this.callback = callback;
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
