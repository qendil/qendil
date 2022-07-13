import { EcsResource } from "@qendil/client-common/ecs";

/**
 * Tracks static game configuration. Think of them as game constants.
 */
export class GameConfig extends EcsResource {
  public readonly fixedUpdateRate = 1 / 20;
}
