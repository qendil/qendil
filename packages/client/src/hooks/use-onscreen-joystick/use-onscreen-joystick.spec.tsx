import useOnScreenJoystick from "./use-onscreen-joystick";
import userEvent from "@testing-library/user-event";
import InputManager, { InputAxis } from "../../utils/input-manager";
import { render, renderHook, screen } from "@testing-library/react";
import { act } from "react-dom/test-utils";

describe("useOnScreenJoystick hook", () => {
  it("shows when triggered by a touch event", async () => {
    // Given an element that triggers the joystick on touch
    // When the element is touched
    // Then the joystick should be visible

    const { result } = renderHook(() => useOnScreenJoystick());

    const inputManager = new InputManager();
    const bindInput = result.current[2];
    act(() => bindInput(inputManager));

    const [, triggerStick] = result.current;
    render(<div onPointerDown={triggerStick}>Touch here</div>);
    const touchable = screen.getByText("Touch here");

    const user = userEvent.setup({ skipAutoClose: true });
    const [showJoystick] = result.current;
    expect(showJoystick).toBeUndefined();

    await user.pointer([{ keys: "[TouchA>]", target: touchable }]);
    const [showJoystick2] = result.current;
    expect(showJoystick2).toBeDefined();
  });

  it("hides the element when touch ends", async () => {
    // Given a visible joystick
    // When the touch pointer is released
    // Then the joystick should be hidden

    const { result } = renderHook(() => useOnScreenJoystick());

    const inputManager = new InputManager();
    const bindInput = result.current[2];
    act(() => bindInput(inputManager));

    const [, triggerStick] = result.current;
    render(<div onPointerDown={triggerStick}>Touch here</div>);
    const touchable = screen.getByText("Touch here");

    const user = userEvent.setup({ skipAutoClose: true });
    await user.pointer([{ keys: "[TouchA>]", target: touchable }]);
    const [showJoystick] = result.current;
    expect(showJoystick).toBeDefined();

    await user.pointer([{ keys: "[/TouchA]", target: touchable }]);
    const [showJoystick2] = result.current;
    expect(showJoystick2).toBeUndefined();
  });

  it("does nothing when no input manager is bound", async () => {
    // Given a joystick with no input manager
    // When I trigger the joystick
    // Then it should not be visible

    const { result } = renderHook(() => useOnScreenJoystick());

    const [, triggerStick] = result.current;
    render(<div onPointerDown={triggerStick}>Touch here</div>);
    const touchable = screen.getByText("Touch here");

    const user = userEvent.setup({ skipAutoClose: true });
    await user.pointer([{ keys: "[TouchA>]", target: touchable }]);
    const [showJoystick] = result.current;
    expect(showJoystick).toBeUndefined();
  });

  it("controls the input manager while moving", async () => {
    // Given a visible joystick
    // And an Input manager
    // When I move the pointer
    // Then the input axis should be updated

    const { result } = renderHook(() => useOnScreenJoystick(50));

    const inputManager = new InputManager();
    const bindInput = result.current[2];
    act(() => bindInput(inputManager));

    const [, triggerStick] = result.current;
    render(<div onPointerDown={triggerStick}>Touch here</div>);
    const touchable = screen.getByText("Touch here");

    const user = userEvent.setup({ skipAutoClose: true });
    await user.pointer([
      {
        keys: "[TouchA>]",
        target: touchable,
        coords: { pageX: 100, pageY: 100 },
      },
      {
        pointerName: "TouchA",
        target: touchable,
        coords: { pageX: 100, pageY: 250 },
      },
    ]);

    expect(inputManager.getAxis(InputAxis.LX)).toEqual(0);
    expect(inputManager.getAxis(InputAxis.LY)).toEqual(1);
  });

  it("does not control the input manager if the moved distance is below the threshold", async () => {
    // Given a visible joystick with a threshold of 0.25
    // And an Input manager
    // When I move the pointer less than the threshold
    // Then the input axis should not be updated

    const { result } = renderHook(() => useOnScreenJoystick(50, 0.25));

    const inputManager = new InputManager();
    const bindInput = result.current[2];
    act(() => bindInput(inputManager));

    const [, triggerStick] = result.current;
    render(<div onPointerDown={triggerStick}>Touch here</div>);
    const touchable = screen.getByText("Touch here");

    const user = userEvent.setup({ skipAutoClose: true });
    await user.pointer([
      {
        keys: "[TouchA>]",
        target: touchable,
        coords: { pageX: 100, pageY: 100 },
      },
      {
        pointerName: "TouchA",
        target: touchable,
        coords: { pageX: 100, pageY: 110 },
      },
    ]);

    expect(inputManager.getAxis(InputAxis.LX)).toEqual(0);
    expect(inputManager.getAxis(InputAxis.LY)).toEqual(0);
  });

  it("ignores non-touch pointer events", async () => {
    // Given a visible joystick
    // And an Input manager
    // When I move the mouse
    // Then the input axis should not be updated

    const { result } = renderHook(() => useOnScreenJoystick(50));

    const inputManager = new InputManager();
    const bindInput = result.current[2];
    act(() => bindInput(inputManager));

    const [, triggerStick] = result.current;
    render(<div onPointerDown={triggerStick}>Touch here</div>);
    const touchable = screen.getByText("Touch here");

    const user = userEvent.setup({ skipAutoClose: true });
    await user.pointer([
      {
        keys: "[TouchA>]",
        target: touchable,
        coords: { pageX: 100, pageY: 100 },
      },
      {
        keys: "[MouseLeft>]",
        target: touchable,
        coords: { pageX: 100, pageY: 100 },
      },
    ]);

    expect(inputManager.getAxis(InputAxis.LX)).toEqual(0);
    expect(inputManager.getAxis(InputAxis.LY)).toEqual(0);

    await user.pointer([
      {
        pointerName: "mouse",
        target: touchable,
        coords: { pageX: 100, pageY: 250 },
      },
    ]);

    expect(inputManager.getAxis(InputAxis.LX)).toEqual(0);
    expect(inputManager.getAxis(InputAxis.LY)).toEqual(0);
  });

  it("ignores touches with different pointers once visible", async () => {
    // Given a joystick triggered with TouchA
    // When I move the pointer with TouchB
    // Then the joystick should not have changed

    const { result } = renderHook(() => useOnScreenJoystick(50));

    const inputManager = new InputManager();
    const bindInput = result.current[2];
    act(() => bindInput(inputManager));

    const [, triggerStick] = result.current;
    const { rerender } = render(
      <div onPointerDown={triggerStick}>Touch here</div>
    );
    const touchable = screen.getByText("Touch here");

    const user = userEvent.setup({ skipAutoClose: true });
    await user.pointer([
      {
        keys: "[TouchA>]",
        target: touchable,
        coords: { pageX: 100, pageY: 100 },
      },
      {
        pointerName: "TouchA",
        target: touchable,
        coords: { pageX: 125, pageY: 100 },
      },
    ]);

    expect(inputManager.getAxis(InputAxis.LX)).toEqual(0.5);
    expect(inputManager.getAxis(InputAxis.LY)).toEqual(0);

    const [, triggerStick2] = result.current;
    rerender(<div onPointerDown={triggerStick2}>Touch here</div>);
    const touchable2 = screen.getByText("Touch here");

    await user.pointer([
      {
        keys: "[TouchB>]",
        target: touchable2,
        coords: { pageX: 100, pageY: 100 },
      },
      {
        pointerName: "TouchB",
        target: touchable,
        coords: { pageX: 100, pageY: 125 },
      },
    ]);

    expect(inputManager.getAxis(InputAxis.LX)).toEqual(0.5);
    expect(inputManager.getAxis(InputAxis.LY)).toEqual(0);
  });

  it("disables the context menu while visible", async () => {
    // Given a window with a context menu
    // And the joystick is visible
    // When I right-click
    // Then the context menu should not be shown

    // Can't exactly test the context menu, so instead
    // i'll just bind an event.
    const menuListener = vi.fn();
    window.addEventListener("contextmenu", menuListener);

    const { result } = renderHook(() => useOnScreenJoystick(50));

    const inputManager = new InputManager();
    const bindInput = result.current[2];
    act(() => bindInput(inputManager));

    const [, triggerStick] = result.current;
    render(<div onPointerDown={triggerStick}>Touch here</div>);
    const touchable = screen.getByText("Touch here");

    const user = userEvent.setup({ skipAutoClose: true });
    await user.pointer([{ keys: "[TouchA>][MouseRight]", target: touchable }]);

    expect(menuListener).not.toHaveBeenCalled();
  });
});
