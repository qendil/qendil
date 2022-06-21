/**
 * A tool for controlling behavior in an ECS application.
 *
 * Systems operate on all entities of a given Component filter.
 */
export type GameSystem<T extends unknown[], R> = {
  (...args: T): R;

  /**
   * Disposes of the system, removing all internal references to it.
   */
  dispose: () => void;
};
