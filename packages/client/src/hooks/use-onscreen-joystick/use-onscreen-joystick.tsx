import { useCallback, useMemo, useState } from "react";

import type { ReactElement, PointerEventHandler } from "react";
import type InputManager from "../../utils/input-manager";
import Joystick from "./joystick";

/**
 * A react hook to create and manage an on-screen joystick
 * that emulates a gamepad joystick.
 *
 * @param radius - The radius of the joystick element.
 * @returns A tuple with 3 things:
 * - The joystick element to be rendered.
 * - A pointerdown handler function to trigger the joystick.
 * - A function to bind the input manager to this on-screen joystick.
 */
export default function useOnScreenJoystick(
  radius = 70,
  deadZoneThreshold = 0.25
): [
  ReactElement | undefined,
  PointerEventHandler,
  (input: InputManager) => void
] {
  const [visible, setVisible] = useState(false);

  const [originX, setOriginX] = useState(0);
  const [originY, setOriginY] = useState(0);

  const [x, setX] = useState(0);
  const [y, setY] = useState(0);

  const [inputManager, setInputManager] = useState<InputManager | undefined>();

  const deadZoneThreshold2 = deadZoneThreshold * deadZoneThreshold;

  const element = useMemo(() => {
    if (visible) {
      return (
        <Joystick
          originX={originX}
          originY={originY}
          radius={radius}
          x={x}
          y={y}
          deadZoneThreshold={deadZoneThreshold}
        />
      );
    }
  }, [deadZoneThreshold, originX, originY, radius, visible, x, y]);

  // Triggers the joystick
  const showJoystick = useCallback<PointerEventHandler>(
    (event): void => {
      // If already visible do to another finger being pressed
      // Then ignore this event...
      if (visible || !inputManager) return;

      const {
        pageX: pointerX,
        pageY: pointerY,
        pointerId,
        pointerType,
      } = event;
      if (pointerType !== "touch") return;

      setOriginX(pointerX);
      setOriginY(pointerY);
      setVisible(true);

      // Utility function to update the axis values
      const updateAxes = (joystickX: number, joystickY: number): void => {
        const magnitude2 = joystickX * joystickX + joystickY * joystickY;
        if (deadZoneThreshold2 > magnitude2) {
          inputManager.updateJoystick("l", 0, 0);
          setX(joystickX);
          setY(joystickY);
        } else {
          const [finalX, finalY] = inputManager.updateJoystick(
            "l",
            joystickX,
            joystickY
          );

          setX(finalX);
          setY(finalY);
        }
      };

      updateAxes(0, 0);

      // Disable the context menu
      // On touch devices, holding touch for a few seconds triggers
      // the context menu, and breaks the joystick
      const handleContextMenu = (menuEvent: Event): void => {
        menuEvent.preventDefault();
        menuEvent.stopImmediatePropagation();
      };

      // Handle touch moves
      const handleTouchMove = (pointerEvent: PointerEvent): void => {
        const {
          pointerId: eventPointerId,
          pageX: eventPointerX,
          pageY: eventPointerY,
        } = pointerEvent;
        if (eventPointerId !== pointerId) return;

        const lx = (eventPointerX - pointerX) / radius;
        const ly = (eventPointerY - pointerY) / radius;

        updateAxes(lx, ly);
      };

      // Handle touch releases
      const handleTouchEnd = (pointerEvent: PointerEvent): void => {
        const { pointerId: eventPointerId } = pointerEvent;
        if (eventPointerId !== pointerId) return;

        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        handleCancel();
      };

      // Handle cancel events (pointercancel, blur...)
      const handleCancel = (): void => {
        updateAxes(0, 0);
        setVisible(false);

        window.removeEventListener("contextmenu", handleContextMenu, true);
        window.removeEventListener("pointermove", handleTouchMove);
        window.removeEventListener("pointerup", handleTouchEnd);
        window.removeEventListener("pointercancel", handleTouchEnd);
        window.removeEventListener("blur", handleCancel);
      };

      // Bind all the event listeners
      window.addEventListener("blur", handleCancel);
      window.addEventListener("pointercancel", handleTouchEnd);
      window.addEventListener("pointerup", handleTouchEnd);
      window.addEventListener("pointermove", handleTouchMove);
      window.addEventListener("contextmenu", handleContextMenu, {
        capture: true,
      });
    },
    [deadZoneThreshold2, inputManager, radius, visible]
  );

  // Function to bind this joystick to an input manager
  const bindInput = useCallback((manager: InputManager): void => {
    setInputManager(manager);
  }, []);

  return [element, showJoystick, bindInput];
}
