import { EcsComponent, EcsSystem } from "@qendil/client-common/ecs";
import type { Client } from "../../world-worker";
import { Position } from "./position";

export class PlayerEntity extends EcsComponent {
  public client: Client;

  public constructor(client: Client) {
    super();

    this.client = client;
  }
}

export const UpdateClientPosition = new EcsSystem(
  ({ entities }) => {
    for (const [{ id }, position, { client }] of entities.withEntities()) {
      client.postMessage({
        type: "updateEntityPosition",
        id,
        position: { ...position },
      });
    }
  },
  [Position, PlayerEntity, Position.changed()]
);
