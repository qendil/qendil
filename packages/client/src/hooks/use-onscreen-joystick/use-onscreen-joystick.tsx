import { useCallback, useMemo, useState } from "react";
import { InputAxis } from "../../utils/input-manager";

import type { ReactElement, TouchEventHandler } from "react";
import type InputManager from "../../utils/input-manager";

import classes from "./joystick.module.css";

export default function useOnScreenJoystick(): [
  ReactElement | undefined,
  TouchEventHandler,
  (input: InputManager) => void
] {
  const [visible, setVisible] = useState(false);

  const [centerX, setCenterX] = useState(0);
  const [centerY, setCenterY] = useState(0);

  const [x, setX] = useState(0);
  const [y, setY] = useState(0);

  const size = 140;
  const size2 = size / 2;

  const [inputManager, setInputManager] = useState<InputManager | undefined>();

  const element = useMemo(() => {
    if (visible)
      return (
        <div
          className={classes.joystickContainer}
          // eslint-disable-next-line react/forbid-dom-props
          style={{
            width: size,
            height: size,
            left: centerX - size2,
            top: centerY - size2,
          }}
        >
          <div
            className={classes.joystick}
            // eslint-disable-next-line react/forbid-dom-props
            style={{
              left: size2 + x * size2,
              top: size2 + y * size2,
            }}
          />
        </div>
      );
  }, [centerX, centerY, size2, visible, x, y]);

  const updateInputManager = useCallback(
    (lx: number, ly: number): void => {
      if (!inputManager) return;

      inputManager.updateAxis(InputAxis.LX, lx);
      inputManager.updateAxis(InputAxis.LY, ly);
    },
    [inputManager]
  );

  const showJoystick = useCallback<TouchEventHandler>(
    (event): void => {
      if (visible) return;

      const { changedTouches } = event;
      if (changedTouches.length === 0) return;
      const touch = changedTouches.item(0);
      const { identifier: pointerId, pageX: pointerX, pageY: pointerY } = touch;

      setCenterX(pointerX);
      setCenterY(pointerY);
      setX(0);
      setY(0);
      setVisible(true);

      updateInputManager(0, 0);

      const handleContextMenu = (menuEvent: Event): void => {
        menuEvent.preventDefault();
      };

      const handleTouchMove = (touchEvent: TouchEvent): void => {
        const { changedTouches: movedTouches } = touchEvent;

        for (let index = 0; index < movedTouches.length; index++) {
          const movedTouch = movedTouches.item(index);
          if (!movedTouch) continue;

          const {
            identifier: eventPointerId,
            pageX: eventPointerX,
            pageY: eventPointerY,
          } = movedTouch;
          if (eventPointerId !== pointerId) continue;

          const lx = Math.min(
            1,
            Math.max(-1, (eventPointerX - pointerX) / size2)
          );
          const ly = Math.min(
            1,
            Math.max(-1, (eventPointerY - pointerY) / size2)
          );

          setX(lx);
          setY(ly);
          updateInputManager(lx, ly);

          break;
        }
      };

      const handleTouchEnd = (touchEvent: TouchEvent): void => {
        const { changedTouches: releasedTouches } = touchEvent;
        for (let index = 0; index < releasedTouches.length; ++index) {
          const releasedTouch = releasedTouches.item(index);
          if (!releasedTouch) continue;

          const { identifier: eventPointerId } = releasedTouch;
          if (eventPointerId !== pointerId) continue;

          // eslint-disable-next-line @typescript-eslint/no-use-before-define
          handleRelease();
          break;
        }
      };

      const handleRelease = (): void => {
        setX(0);
        setY(0);
        updateInputManager(0, 0);

        window.removeEventListener("contextmenu", handleContextMenu);
        window.removeEventListener("touchmove", handleTouchMove);
        window.removeEventListener("touchend", handleTouchEnd);
        window.removeEventListener("touchcancel", handleTouchEnd);
        window.removeEventListener("blur", handleRelease);

        setVisible(false);
      };

      window.addEventListener("blur", handleRelease);
      window.addEventListener("touchcancel", handleTouchEnd);
      window.addEventListener("touchend", handleTouchEnd);
      window.addEventListener("touchmove", handleTouchMove);
      window.addEventListener("contextmenu", handleContextMenu);
    },
    [size2, updateInputManager, visible]
  );

  const bindInput = useCallback((manager: InputManager): void => {
    setInputManager(manager);
  }, []);

  return [element, showJoystick, bindInput];
}
