import { GameComponent, GameSystem } from "../utils/game-world";
import { InputAxis } from "../utils/input-manager";

import type InputManager from "../utils/input-manager";
import { RigidBody } from "./rigid-body";
import { Vector3 } from "@dimforge/rapier3d-compat";

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
      const rigidBody = entity.tryGet(RigidBody);
      if (rigidBody !== undefined) {
        const { body } = rigidBody;

        body?.setLinvel(new Vector3(4 * lx, 0, 4 * ly), true);
      }
    }
  }
);
