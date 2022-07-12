import type EcsManager from "./ecs-manager";
import type { default as EcsSystem, EcsSystemHandle } from "./ecs-system";

/**
 * A helper to manage and run systems in bulk.
 */
export type EcsSystemRunner = {
  (): void;
  add: (system: EcsSystem) => EcsSystemRunner;
  dispose: () => void;
};

/**
 * Makes a system runner.
 *
 * @param manager - The ECS manager to use for instantiating systems.
 * @returns An ECS scheduler.
 */
export function makeSystemRunner(manager: EcsManager): EcsSystemRunner {
  const systems: EcsSystemHandle[] = [];

  const scheduler = (): void => {
    for (const system of systems) {
      system();
    }
  };

  scheduler.add = (system: EcsSystem): EcsSystemRunner => {
    const handle = manager.addSystem(system);
    systems.push(handle);

    return scheduler;
  };

  scheduler.dispose = (): void => {
    for (const system of systems) {
      system.dispose();
    }
  };

  return scheduler;
}
