import { EcsResource } from "../../utils/ecs";

/**
 * Tracks informations about the last frame.
 */
export class FrameInfo extends EcsResource {
  public frametime = 0;
}
