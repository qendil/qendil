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
export type SystemQuery = Record<
  Exclude<string, "command" | "resources">,
  ComponentFilterTuple | ResourceFilterTuple
> & {
  resources?: ResourceFilterTuple;
  command?: never;
};

/**
 * An object with the results of a System Query.
 */
export type SystemQueryResult<T extends SystemQuery> = {
  [K in Exclude<
    keyof T,
    "command" | "resources"
  >]: T[K] extends ComponentFilterTuple ? EcsQuery<T[K]> : undefined;
} & {
  resources: T["resources"] extends ResourceFilterTuple
    ? ResourceInstances<T["resources"]>
    : [];
  command: (command: EcsCommand) => void;
};

/**
 * A tool for controlling behavior in an ECS application.
 *
 * Systems operate on all entities of a given Component filter.
 */
export default class EcsSystem<T extends SystemQuery> {
  public readonly query: T;
  public readonly callback: (query: SystemQueryResult<T>) => void;

  public constructor(
    query: T,
    callback: (query: SystemQueryResult<T>) => void
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
