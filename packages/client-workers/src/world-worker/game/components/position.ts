import { EcsComponent, EcsSystem } from "@qendil/client-common/ecs";
import { PlayerEntity } from "./player-entity";

/**
 * Tags entities that have a position.
 */
export class Position extends EcsComponent {
  public x = 0;
  public y = 0;
  public z = 0;
}

export const UpdateClientPosition = new EcsSystem(
  { entities: [Position, Position.changed()], clients: [PlayerEntity] },
  ({ entities, clients }) => {
    for (const [{ id }, position] of entities.withEntities()) {
      for (const [{ client }] of clients) {
        client.postMessage({
          type: "updateEntityPosition",
          id,
          position: { ...position },
        });
      }
    }
  }
);
