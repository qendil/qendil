import { EcsResource } from "../utils/ecs";

export class GameConfigResource extends EcsResource {
  public readonly fixedUpdateRate = 1 / 20;
}
