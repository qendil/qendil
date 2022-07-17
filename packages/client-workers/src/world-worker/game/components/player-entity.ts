import { EcsComponent } from "@qendil/client-common/ecs";
import type { Client } from "../../world-worker";

export class PlayerEntity extends EcsComponent {
  public client: Client;

  public constructor(client: Client) {
    super();

    this.client = client;
  }
}
