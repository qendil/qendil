import { EcsComponent, EcsSystem } from "../utils/ecs";
import { Position } from "./position";

/**
 * Tags entities that should have their position animated smoothly.
 */
export class SmoothPosition extends EcsComponent {
  public animationPercent = 1;
  public x = 0;
  public y = 0;
  public z = 0;
  public originalX = 0;
  public originalY = 0;
  public originalZ = 0;
}

/**
 * Matches the initial position of the smooth position component
 * to the position component.
 */
export const SmoothPositionInit = new EcsSystem(
  [SmoothPosition, Position, Position.added()],
  (query) => {
    for (const [smooth, { x, y, z }] of query) {
      smooth.x = x;
      smooth.y = y;
      smooth.z = z;
      smooth.originalX = x;
      smooth.originalY = y;
      smooth.originalZ = z;
      smooth.animationPercent = 0;
    }
  }
);

/**
 * Updates the source position when the position component changes.
 */
export const SmoothPositionUpdate = new EcsSystem(
  [SmoothPosition, Position.changed()],
  (query) => {
    for (const [smooth] of query) {
      const { x, y, z } = smooth;

      smooth.animationPercent = 0;
      smooth.originalX = x;
      smooth.originalY = y;
      smooth.originalZ = z;
    }
  }
);

/**
 * Animates the position of the entity.
 */
export const SmoothPositionAnimate = new EcsSystem(
  [Position, SmoothPosition, SmoothPosition.present()],
  (query, frametime: number, fixedInterval: number) => {
    const factor = frametime / fixedInterval;

    for (const [{ x, y, z }, smooth] of query) {
      if (smooth.animationPercent >= 1) continue;

      const { animationPercent, originalX, originalY, originalZ } = smooth;

      const percent = Math.min(1, animationPercent + factor);

      smooth.animationPercent = percent;
      smooth.x = originalX + (x - originalX) * percent;
      smooth.y = originalY + (y - originalY) * percent;
      smooth.z = originalZ + (z - originalZ) * percent;
    }
  }
);
