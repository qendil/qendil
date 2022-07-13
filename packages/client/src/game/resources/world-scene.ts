import { Scene } from "three";
import { EcsResource } from "@qendil/client-common/ecs";

/**
 * Contains the main 3D scene of the game.
 */
export class WorldScene extends EcsResource {
  public readonly scene = new Scene();
}
