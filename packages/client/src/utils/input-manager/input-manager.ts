import { ArrayMap, SetMap } from "../default-map";

export enum InputAction {
  Interact = "interact",
  Cancel = "cancel",
  Up = "up",
  Right = "right",
  Down = "down",
  Left = "left",
}
export type DirectionInputAction =
  | InputAction.Down
  | InputAction.Left
  | InputAction.Right
  | InputAction.Up;

export enum InputAxis {
  LX = "lx",
  LY = "ly",
  RX = "rx",
  RY = "ry",
  LT = "lt",
  RT = "rt",
}

export type KeyboardMapping = Record<string, InputAction>;

const DIRECTION_TO_AXIS = {
  [InputAction.Up]: -1,
  [InputAction.Down]: 1,
  [InputAction.Left]: -1,
  [InputAction.Right]: 1,
} as const;

type AxesValues = Record<InputAxis, number>;

/**
 * Manages input for a single context.
 */
export default class InputManager {
  private readonly keysDownPerAction = new SetMap<InputAction, string>();
  private readonly currentKeysDown = new Set<InputAction>();
  private previousKeysDown = new Set<InputAction>();
  private keymap: KeyboardMapping = {};

  private readonly axesActionStacks = new ArrayMap<
    InputAxis,
    DirectionInputAction
  >();

  private readonly axesValues: AxesValues = {
    [InputAxis.LX]: 0,
    [InputAxis.LY]: 0,
    [InputAxis.LT]: 0,
    [InputAxis.RX]: 0,
    [InputAxis.RY]: 0,
    [InputAxis.RT]: 0,
  };

  public constructor() {
    this.update = this.update.bind(this);
    this.keydownHandler = this.keydownHandler.bind(this);
    this.keyupHandler = this.keyupHandler.bind(this);
    this.blurHandler = this.blurHandler.bind(this);
  }

  public setKeymap(keymap: KeyboardMapping): void {
    this.keymap = keymap;
  }

  public bind(): void {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    window.addEventListener("keydown", this.keydownHandler);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    window.addEventListener("keyup", this.keyupHandler);

    // eslint-disable-next-line @typescript-eslint/unbound-method
    window.addEventListener("blur", this.blurHandler);
  }

  public dispose(): void {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    window.removeEventListener("blur", this.blurHandler);

    // eslint-disable-next-line @typescript-eslint/unbound-method
    window.removeEventListener("keyup", this.keyupHandler);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    window.removeEventListener("keydown", this.keydownHandler);
  }

  /**
   * Updates the value of an axis.
   * This is primarily used by on-screen controls.
   *
   * @param axis - The axis to update
   * @param value - The value to set the axis to
   */
  public updateAxis(axis: InputAxis, value: number): void {
    this.axesValues[axis] = value;
  }

  public isActionDown(action: InputAction): boolean {
    return this.currentKeysDown.has(action);
  }

  public isActionPressed(action: InputAction): boolean {
    return (
      this.currentKeysDown.has(action) && !this.previousKeysDown.has(action)
    );
  }

  public isActionReleased(action: InputAction): boolean {
    return (
      !this.currentKeysDown.has(action) && this.previousKeysDown.has(action)
    );
  }

  public getAxis(axis: keyof AxesValues): number {
    return this.axesValues[axis];
  }

  public update(): void {
    this.previousKeysDown = new Set(this.currentKeysDown);
  }

  private keydownHandler(event: KeyboardEvent): void {
    // Ignore this if an input is currently focused
    if (this.isInputElementActive()) return;

    const { code } = event;

    // Check if this key is mapped to an action
    const action = this.keymap[code];
    if (action === undefined) return;

    // Prevent default behavior
    event.preventDefault();
    event.stopPropagation();

    // Mark the key as currently down
    const actionKeysDown = this.keysDownPerAction.get(action);
    const repeat = actionKeysDown.has(code);

    if (!repeat) {
      actionKeysDown.add(code);
      this.currentKeysDown.add(action);

      // Trigger axis update
      switch (action) {
        case InputAction.Up:
        case InputAction.Right:
        case InputAction.Down:
        case InputAction.Left:
          this.axesActionDown(action);
          break;
        default:
          break;
      }
    }
  }

  private keyupHandler(event: KeyboardEvent): void {
    // Ignore this if an input is currently focused
    if (this.isInputElementActive()) return;

    const { code } = event;

    // Check if this key is mapped to an action
    const action = this.keymap[code];
    if (action === undefined) return;

    // Prevent default behavior
    event.preventDefault();
    event.stopPropagation();

    // Mark the key as currently up
    const actionKeysDown = this.keysDownPerAction.get(action);
    actionKeysDown.delete(code);
    if (actionKeysDown.size === 0) {
      this.currentKeysDown.delete(action);
    }

    // Trigger axis update
    switch (action) {
      case InputAction.Up:
      case InputAction.Right:
      case InputAction.Down:
      case InputAction.Left:
        this.axesActionUp(action);
        break;
      default:
        break;
    }
  }

  private blurHandler(): void {
    // Reset actions that are "down"
    this.keysDownPerAction.clear();
    this.currentKeysDown.clear();

    // Reset axes
    this.axesActionStacks.clear();
    for (const axis of Object.keys(this.axesValues)) {
      this.axesValues[axis as InputAxis] = 0;
    }
  }

  private axesActionDown(action: DirectionInputAction): void {
    const axis =
      action === InputAction.Up || action === InputAction.Down
        ? InputAxis.LY
        : InputAxis.LX;
    const stack = this.axesActionStacks.get(axis);

    // Only change axis value if this action was not the last one in the stack
    const lastDirection = stack[0];
    if (action !== lastDirection) {
      const value = DIRECTION_TO_AXIS[action];

      this.axesValues[axis] = value;
    }

    // Add the action to the stack
    stack.unshift(action);
  }

  private axesActionUp(action: DirectionInputAction): void {
    const axis =
      action === InputAction.Up || action === InputAction.Down
        ? InputAxis.LY
        : InputAxis.LX;
    const stack = this.axesActionStacks.get(axis);

    // If the action is not in the stack, then there's nothing to do
    const actionIndex = stack.indexOf(action);
    if (actionIndex === -1) return;

    // Remove the action from the stack
    stack.splice(actionIndex, 1);

    // If the removed action was the first in the stack, then update the axis
    // value to the previous action. Or to 0 if there are no previous actions.
    if (actionIndex === 0) {
      const lastDirection = stack[0];
      const value =
        lastDirection === undefined ? 0 : DIRECTION_TO_AXIS[lastDirection];

      this.axesValues[axis] = value;
    }
  }

  private isInputElementActive(): boolean {
    const focusedElement = document.activeElement;
    if (!focusedElement) return false;

    return ["INPUT", "TEXTAREA"].includes(focusedElement.tagName);
  }
}
