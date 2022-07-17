import { EcsComponent, EcsSystem } from "@qendil/client-common/ecs";
import { GameConfig } from "../resources/game-config";
import { Position } from "./position";

/**
 * Tags entities that have a velocity.
 */
export class Velocity extends EcsComponent {
  public x = 0;
  public y = 0;
  public z = 0;
  public factor = 1;
}

/**
 * Updates entities' positions based on their velocity.
 */
export const VelocitySystem = new EcsSystem(
  ({ entities, resources: [gameConfig] }) => {
    const { fixedUpdateRate } = gameConfig;

    for (const [position, { x, y, z }] of entities) {
      position.x += x * fixedUpdateRate;
      position.y += y * fixedUpdateRate;
      position.z += z * fixedUpdateRate;
    }
  },
  {
    entities: [Position, Velocity],
    resources: [GameConfig],
  }
);
