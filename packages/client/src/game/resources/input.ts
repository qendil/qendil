import { EcsResource, EcsSystem } from "@qendil/client-common/ecs";
import InputManager, { InputAction } from "../../utils/input-manager";

const GLOBAL_INPUT_MANAGER = new InputManager();
GLOBAL_INPUT_MANAGER.bind();

// Temporary until we have settings
const KEYBOARD_MAP = {
  menu: {
    KeyW: InputAction.Up,
    ArrowUp: InputAction.Up,
    KeyD: InputAction.Right,
    ArrowRight: InputAction.Right,
    KeyS: InputAction.Down,
    ArrowDown: InputAction.Down,
    KeyA: InputAction.Left,
    ArrowLeft: InputAction.Left,
    KeyF: InputAction.Interact,
    Tab: InputAction.Cancel,
  },
  world: {
    KeyW: InputAction.Up,
    ArrowUp: InputAction.Up,
    KeyD: InputAction.Right,
    ArrowRight: InputAction.Right,
    KeyS: InputAction.Down,
    ArrowDown: InputAction.Down,
    KeyA: InputAction.Left,
    ArrowLeft: InputAction.Left,
    KeyF: InputAction.Interact,
  },
} as const;

/**
 * Exposes the input manager.
 */
export class Input extends EcsResource {
  public readonly input = GLOBAL_INPUT_MANAGER;
  public keymap: keyof typeof KEYBOARD_MAP = "menu";
}

/**
 * Updates the input manager with other config.
 */
export const UpdateInputConfig = new EcsSystem(
  { resources: [Input, Input.changed()] },
  ({ resources: [{ input, keymap }] }) => {
    input.setKeymap(KEYBOARD_MAP[keymap]);
  }
);
