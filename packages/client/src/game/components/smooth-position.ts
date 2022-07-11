import { EcsComponent, EcsSystem } from "../../utils/ecs";
import { FrameInfo } from "../resources/frame-info";
import { GameConfig } from "../resources/game-config";
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
  ({ entities }) => {
    for (const [smooth, { x, y, z }] of entities) {
      smooth.x = x;
      smooth.y = y;
      smooth.z = z;
      smooth.originalX = x;
      smooth.originalY = y;
      smooth.originalZ = z;
      smooth.animationPercent = 0;
    }
  },
  [SmoothPosition, Position, Position.added()]
);

/**
 * Updates the source position when the position component changes.
 */
export const SmoothPositionUpdate = new EcsSystem(
  ({ entities }) => {
    for (const [smooth] of entities) {
      const { x, y, z } = smooth;

      smooth.animationPercent = 0;
      smooth.originalX = x;
      smooth.originalY = y;
      smooth.originalZ = z;
    }
  },
  [SmoothPosition, Position.changed()]
);

/**
 * Animates the position of the entity.
 */
export const SmoothPositionAnimate = new EcsSystem(
  ({ entities, resources: [frameInfo, gameConfig] }) => {
    const { frametime } = frameInfo;
    const { fixedUpdateRate } = gameConfig;
    const factor = frametime / fixedUpdateRate;

    for (const [{ x, y, z }, smooth] of entities) {
      if (smooth.animationPercent >= 1) continue;

      const { animationPercent, originalX, originalY, originalZ } = smooth;

      const percent = Math.min(1, animationPercent + factor);

      smooth.animationPercent = percent;
      smooth.x = originalX + (x - originalX) * percent;
      smooth.y = originalY + (y - originalY) * percent;
      smooth.z = originalZ + (z - originalZ) * percent;
    }
  },
  {
    entities: [Position, SmoothPosition, SmoothPosition.present()],
    resources: [FrameInfo, GameConfig],
  }
);
