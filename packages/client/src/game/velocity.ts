import { GameComponent, GameSystem } from "../utils/game-world";
import { Position } from "./position";

/**
 * Tags entities that have a velocity.
 */
export class Velocity extends GameComponent {
  public x = 0;
  public y = 0;
  public z = 0;
  public factor = 1;
}

/**
 * Updates entities' positions based on their velocity.
 */
export const VelocitySystem = new GameSystem(
  [Position, Velocity],
  (query, dt: number) => {
    for (const [position, { x, y, z }] of query) {
      position.x += x * dt;
      position.y += y * dt;
      position.z += z * dt;
    }
  }
);
