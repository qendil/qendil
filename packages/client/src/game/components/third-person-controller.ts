import { EcsComponent, EcsSystem } from "@qendil/client-common/ecs";
import { InputAxis } from "../../utils/input-manager";

import { Input } from "../resources/input";
import WorkerConnection from "../resources/worker-connection";

/**
 * Tags entities that are controlled by a third-person camera.
 */
export class ThirdPersonController extends EcsComponent {}

/**
 * Updates controllable entities based on the input.
 *
 * e.g.:
 * - Changes the velocity based on the joystick.
 * - Changes the direction of the entity based on the direction of the joystick.
 */
export const ThirdPersonControlSystem = new EcsSystem(
  {
    entities: [ThirdPersonController.present()],
    resources: [Input, WorkerConnection],
  },
  ({ entities, resources: [inputResource, { postMessage }] }) => {
    if (entities.size === 0) return;
    const { input } = inputResource;

    if (
      !input.hasAxisChanged(InputAxis.LX) &&
      !input.hasAxisChanged(InputAxis.LY)
    ) {
      return;
    }

    const lx = input.getAxis(InputAxis.LX);
    const ly = input.getAxis(InputAxis.LY);

    const speed = 3;
    postMessage({
      type: "updatePlayerVelocity",
      x: speed * lx,
      y: speed * -ly,
    });
  }
);
