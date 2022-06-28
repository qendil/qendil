import { GameComponent } from "../utils/game-world";

/**
 * Tags entities that have a position.
 */
export class Position extends GameComponent {
  public x = 0;
  public y = 0;
  public z = 0;
}
