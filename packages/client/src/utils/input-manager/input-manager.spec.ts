import InputManager, { InputAction, InputAxis } from "./input-manager";
import userEvent from "@testing-library/user-event";
import type { UserEvent } from "@testing-library/user-event/dist/types/setup";
import { fireEvent } from "@testing-library/react";

describe("InputManager", () => {
  const keymap = {
    ArrowUp: InputAction.Up,
    ArrowRight: InputAction.Right,
    ArrowDown: InputAction.Down,
    ArrowLeft: InputAction.Left,
    KeyF: InputAction.Interact,
  };

  beforeEach((context) => {
    // Create an input manager
    const input = new InputManager();
    input.setKeymap(keymap);
    input.bind();
    context.input = input;

    // Create an input user
    context.user = userEvent.setup({ skipAutoClose: true });

    // Remove currently active element
    const { activeElement } = document;
    if (activeElement instanceof HTMLElement) {
      activeElement.blur();
    }
  });

  afterEach((context) => {
    const input = context.input as InputManager;
    input.dispose();
  });

  it("tracks down keys", async (context) => {
    // Given an input manager
    // When I press a key
    // Then its action should be marked as pressed
    // When I release that same key
    // Then its action should be marked as not pressed

    const input = context.input as InputManager;
    const user = context.user as UserEvent;

    await user.keyboard("[KeyF>]");

    expect(input.isActionDown(InputAction.Interact)).toBe(true);

    await user.keyboard("[/KeyF]");

    expect(input.isActionDown(InputAction.Interact)).toBe(false);
  });

  it("ignores repeated down keys", async (context) => {
    // Given an input manager
    // When I press a key twice
    // Then its action should be marked as pressed
    // When I release that same key
    // Then it should be marked as not pressed

    const input = context.input as InputManager;
    const user = context.user as UserEvent;

    await user.keyboard("[KeyF>][KeyF>]");

    expect(input.isActionDown(InputAction.Interact)).toBe(true);

    await user.keyboard("[/KeyF]");

    expect(input.isActionDown(InputAction.Interact)).toBe(false);
  });

  it("ignores keys not in the key map", async (context) => {
    // Given an input manager
    // When I press a non-mapped key
    // Then all actions should be marked as non pressed

    const input = context.input as InputManager;
    const user = context.user as UserEvent;

    await user.keyboard("[KeyN]");

    for (const action of Object.values(InputAction)) {
      expect(input.isActionDown(action)).toBe(false);
    }
  });

  it("tracks pressed keys", async (context) => {
    // Given an input manager
    // When I press a key
    // Then the key's action should be marked as just pressed

    const input = context.input as InputManager;
    const user = context.user as UserEvent;

    await user.keyboard("[KeyF>]");

    expect(input.isActionPressed(InputAction.Interact)).toBe(true);
  });

  it("tracks released keys", async (context) => {
    // Given an input manager
    // When I press a key
    // And wait for the next update
    // And I release that key
    // Then the key's action should be marked as just released

    const input = context.input as InputManager;
    const user = context.user as UserEvent;

    await user.keyboard("[ArrowUp>]");
    input.update();

    await user.keyboard("[/ArrowUp]");

    expect(input.isActionReleased(InputAction.Up)).toBe(true);
  });

  it("maps direction actions to axes", async (context) => {
    // Given an input manager
    // When I press the left arrow key
    // Then the left X axis should be at -1

    const input = context.input as InputManager;
    const user = context.user as UserEvent;

    expect(input.getAxis(InputAxis.LX)).not.toBe(-1);

    await user.keyboard("[ArrowLeft>]");

    expect(input.getAxis(InputAxis.LX)).toBe(-1);
  });

  it("respects direction actions order when mapping to axes", async (context) => {
    // Given an input manager
    // When I press the up arrow key
    // Then I press the down arrow key 3 times
    // Then I release the up arrow key
    // Then the left Y axis should be at -1

    const input = context.input as InputManager;
    const user = context.user as UserEvent;

    expect(input.getAxis(InputAxis.LY)).not.toBe(-1);

    await user.keyboard("[ArrowUp>][ArrowDown>3/]");

    expect(input.getAxis(InputAxis.LY)).toBe(-1);
  });

  it("clears down keys when the window blurs", async (context) => {
    // Given an input manager
    // When I press a key
    // Then blur the window
    // Then the key's action should be marked as not pressed

    const input = context.input as InputManager;
    const user = context.user as UserEvent;

    await user.keyboard("[KeyF>]");
    expect(input.isActionDown(InputAction.Interact)).toBe(true);

    fireEvent.blur(window);

    expect(input.isActionDown(InputAction.Interact)).toBe(false);
  });

  it("resets axes when the window blurs", async (context) => {
    // Given an input manager
    // When I press the down arrow key
    // And I blur the window
    // Then the left Y axis should be at 0

    const input = context.input as InputManager;
    const user = context.user as UserEvent;

    await user.keyboard("[ArrowDown>]");
    expect(input.getAxis(InputAxis.LY)).toBe(1);

    fireEvent.blur(window);

    expect(input.getAxis(InputAxis.LY)).toBe(0);
  });

  it("resets axes' action stacks when the window blurs", async (context) => {
    // Given an input manager
    // When I press the left arrow key
    // And I blur the window
    // And I press and release the right arrow key
    // Then the left X axis should be at 0

    const input = context.input as InputManager;
    const user = context.user as UserEvent;

    await user.keyboard("[ArrowLeft>]");
    expect(input.getAxis(InputAxis.LX)).toBe(-1);

    fireEvent.blur(window);

    await user.keyboard("[ArrowRight]");
    expect(input.getAxis(InputAxis.LX)).toBe(0);
  });

  it("does nothing when a direction key that's not in the axis is released", (context) => {
    // Given an input manager
    // Adn a key that's already pressed (outside the window)
    // When I release the key
    // Then the axis value should not change

    const input = context.input as InputManager;

    expect(input.getAxis(InputAxis.LY)).toBe(0);

    fireEvent.keyUp(window, { code: "ArrowUp" });
    expect(input.getAxis(InputAxis.LY)).toBe(0);
  });

  it("ignores input when an input element is focused", async (context) => {
    // Given an input manager
    // And an input element that's focused
    // When I press a key
    // Then the key's action should not be marked as pressed

    const input = context.input as InputManager;
    const user = context.user as UserEvent;

    const inputElement = document.createElement("input");
    document.body.append(inputElement);

    await user.click(inputElement);

    await user.keyboard("[KeyF>]");
    expect(input.isActionDown(InputAction.Interact)).toBe(false);
    expect(input.isActionPressed(InputAction.Interact)).toBe(false);

    input.update();
    await user.keyboard("[/KeyF]");
    expect(input.isActionReleased(InputAction.Interact)).toBe(false);

    expect(inputElement.value).toBe("f");
  });

  it("caps joystick length to 1", async (context) => {
    // Given an input manager
    // When I press the left arrow key
    // And I press the down arrow key
    // Then the left axis should be at -0.707106, 0.707106

    const input = context.input as InputManager;
    const user = context.user as UserEvent;

    await user.keyboard("[ArrowLeft>][ArrowDown>]");

    const xApprox = Math.cos((3 * Math.PI) / 4); // =~ -0.707106
    expect(input.getAxis(InputAxis.LX)).toBeCloseTo(xApprox);

    const yApprox = -Math.sin((7 * Math.PI) / 4); // =~ 0.707106
    expect(input.getAxis(InputAxis.LY)).toBeCloseTo(yApprox);
  });

  test("updateJoystick updates axis values correctly", (context) => {
    // Given an input manager
    // When I call updateJoystick with 2 values
    // Then I should get those values from the corresponding axes

    const input = context.input as InputManager;

    input.updateJoystick("r", 0.5, 0.5);

    expect(input.getAxis(InputAxis.RX)).toBe(0.5);
    expect(input.getAxis(InputAxis.RY)).toBe(0.5);
  });
});
