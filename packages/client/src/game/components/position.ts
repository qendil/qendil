import { EcsComponent } from "../../utils/ecs";

/**
 * Tags entities that have a position.
 */
export class Position extends EcsComponent {
  public x = 0;
  public y = 0;
  public z = 0;
}
