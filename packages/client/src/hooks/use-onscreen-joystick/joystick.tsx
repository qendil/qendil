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

  /**
   * A threshold for the joystick to be considered "in-dead-zone".
   * Value should be between 0 and 1.
   */
  deadZoneThreshold: number;
};

/**
 * An on-screen joystick element that can be used to emulate a gamepad joystick.
 */
export default function Joystick(props: JoystickProps): ReactElement {
  const { x, y, originX, originY, radius, deadZoneThreshold } = props;

  const diameter = radius * 2;

  const containerStyle = {
    width: diameter,
    height: diameter,
    left: originX - radius,
    top: originY - radius,
  };

  const deadzoneSize = 2 * radius * deadZoneThreshold;
  const deadzoneStyle = {
    width: deadzoneSize,
    height: deadzoneSize,
  };

  const joystickStyle = {
    left: (x + 1) * radius,
    top: (y + 1) * radius,
  };

  return (
    <div className={classes.joystickContainer} style={containerStyle}>
      <div className={classes.deadZone} style={deadzoneStyle} />
      <div className={classes.joystick} style={joystickStyle} />
    </div>
  );
}
