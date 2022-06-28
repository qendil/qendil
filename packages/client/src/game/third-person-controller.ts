import { GameComponent, GameSystem } from "../utils/game-world";
import { InputAxis } from "../utils/input-manager";
import { Velocity } from "./velocity";

import type InputManager from "../utils/input-manager";

/**
 * Tags entities that are controlled by a third-person camera.
 */
export class ThirdPersonController extends GameComponent {
  // Nothing here
}

/**
 * Updates controllable entities based on the input.
 *
 * e.g.:
 * - Changes the velocity based on the joystick.
 * - Changes the direction of the entity based on the direction of the joystick.
 */
export const ThirdPersonControlSystem = new GameSystem(
  [ThirdPersonController.present()],
  (query, input: InputManager) => {
    const lx = input.getAxis(InputAxis.LX);
    const ly = input.getAxis(InputAxis.LY);

    for (const entity of query.asEntities()) {
      const velocity = entity.tryGet(Velocity);
      if (velocity !== undefined) {
        const { factor: speed } = velocity;

        velocity.x = lx * speed;
        velocity.y = -ly * speed;
      }
    }
  }
);