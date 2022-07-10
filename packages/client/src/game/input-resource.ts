import { EcsResource } from "../utils/ecs";
import InputManager, { InputAction } from "../utils/input-manager";

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
} as const;

export class InputResource extends EcsResource {
  public input = new InputManager();

  public constructor() {
    super();

    // Setup input context
    this.input.setKeymap(KEYBOARD_MAP.menu);

    this.input.bind();
  }

  public dispose(): void {
    this.input.dispose();
  }
}
