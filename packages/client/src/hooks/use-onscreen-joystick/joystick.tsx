import type { ReactElement } from "react";

import classes from "./joystick.module.css";

export type JoystickProps = {
  /**
   * The current X value of the joystick
   */
  x: number;

  /**
   * The current Y value of the joystick
   */
  y: number;

  /**
   * The origin X coordinate of the joystick element, relative to the page.
   */
  originX: number;

  /**
   * The origin Y coordinate of the joystick element, relative to the page.
   */
  originY: number;

  /**
   * The radius of the joystick element.
   */
  radius: number;
};

/**
 * An on-screen joystick element that can be used to emulate a gamepad joystick.
 */
export default function Joystick(props: JoystickProps): ReactElement {
  const { x, y, originX, originY, radius } = props;

  const diameter = radius * 2;

  const containerStyle = {
    width: diameter,
    height: diameter,
    left: originX - radius,
    top: originY - radius,
  };

  const joystickStyle = {
    left: (x + 1) * radius,
    top: (y + 1) * radius,
  };

  return (
    <div className={classes.joystickContainer} style={containerStyle}>
      <div className={classes.joystick} style={joystickStyle} />
    </div>
  );
}
