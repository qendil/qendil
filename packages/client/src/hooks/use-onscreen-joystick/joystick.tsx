import classNames from "classnames";
import { useMemo } from "react";

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
 * Utility class to calculate 8-way joystick directions.
 */
function getDirections(x: number, y: number, deadzone: number): string[] {
  const directions: string[] = [];
  if (x * x + y * y < deadzone * deadzone) {
    return directions;
  }

  const angle = Math.atan2(-y, x);

  if (angle >= Math.PI / 8 && angle <= (7 * Math.PI) / 8) {
    directions.push("north");
  } else if (angle <= -Math.PI / 8 && angle >= (-7 * Math.PI) / 8) {
    directions.push("south");
  }

  if (angle <= (3 * Math.PI) / 8 && angle >= (-3 * Math.PI) / 8) {
    directions.push("east");
  } else if (angle >= (5 * Math.PI) / 8 || angle <= (-5 * Math.PI) / 8) {
    directions.push("west");
  }

  return directions;
}

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

  const directions = useMemo(
    () => getDirections(x, y, deadZoneThreshold),
    [deadZoneThreshold, x, y]
  );

  return (
    <div
      className={classNames(classes.joystickContainer, ...directions)}
      style={containerStyle}
      data-testid="joystick-container"
    >
      <div
        className={classes.deadZone}
        style={deadzoneStyle}
        data-testid="joystick-deadzone"
      />
      <div
        className={classes.joystick}
        style={joystickStyle}
        data-testid="joystick"
      />
    </div>
  );
}
