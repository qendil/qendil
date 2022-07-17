import { EcsManager } from "@qendil/client-common/ecs";
import {
  PlayerEntity,
  UpdateClientPosition,
} from "./game/components/player-entity";
import { Position } from "./game/components/position";
import { Velocity, VelocitySystem } from "./game/components/velocity";
import { GameConfig } from "./game/resources/game-config";
import { NetworkEntity } from "./game/components/network-entity";
import { Mesh } from "./game/components/mesh";

import type { EcsEntity } from "@qendil/client-common/ecs";

// Some typescript declaraions
declare let self: SharedWorkerGlobalScope;

// TODO: Have a single codebae for these
type WorkerClientMessage =
  | {
      type: "spawnPlayer";
      id: number;
      mesh: { color: number };
      position: { x: number; y: number; z: number };
    }
  | {
      type: "updateEntityPosition";
      id: number;
      position: { x: number; y: number; z: number };
    }
  | {
      type: "spawnEntity";
      id: number;
      position: { x: number; y: number; z: number };
      mesh: { color: number };
    }
  | { type: "pong" }
  | { type: "log"; message: string };

type ClientWorkerMessage =
  | { type: "playerReady" }
  | { type: "updatePlayerVelocity"; x: number; y: number }
  | { type: "ping" }
  | { type: "disconnect" };

type PostMessageCallback = (
  message: WorkerClientMessage,
  transferable?: Transferable[]
) => void;

const gameWorld = new EcsManager();
const update = gameWorld
  .addRunner()
  .add(VelocitySystem)
  .add(UpdateClientPosition);
gameWorld.resources.add(GameConfig);

const networkEntitiesQuery = gameWorld
  .createEntityQuery([NetworkEntity, Position.present(), Mesh.present()])
  .wrap();

const playerEntities = gameWorld.createEntityQuery([PlayerEntity]).wrap();

export class Client {
  public readonly postMessage: PostMessageCallback;
  public readonly playerEntity: EcsEntity;

  public constructor(
    playerEntity: EcsEntity,
    postMessage: PostMessageCallback
  ) {
    this.playerEntity = playerEntity;
    this.postMessage = postMessage;
  }

  public onMessage(message: ClientWorkerMessage): void {
    switch (message.type) {
      case "ping": {
        this.postMessage({ type: "pong" });
        break;
      }

      case "updatePlayerVelocity": {
        const { x, y } = message;

        const velocity = this.playerEntity.get(Velocity);
        velocity.x = x;
        velocity.y = y;
        break;
      }

      default: {
        this.postMessage({
          type: "log",
          message: `Received ${JSON.stringify(message)}`,
        });

        break;
      }
    }
  }
}

const clients = new Set<Client>();

const broadcast: PostMessageCallback = (message, transferable) => {
  for (const client of clients) {
    client.postMessage(message, transferable);
  }
};

self.addEventListener("connect", (connectEvent) => {
  const [port] = connectEvent.ports;
  if (!port) return;

  const postMessage: PostMessageCallback = (message, transferable) => {
    if (transferable) {
      port.postMessage(message, transferable);
    } else {
      port.postMessage(message);
    }
  };

  for (const entity of networkEntitiesQuery.asEntities()) {
    const position = entity.get(Position);
    const mesh = entity.get(Mesh);
    postMessage({
      type: "spawnEntity",
      id: entity.id,
      position: {
        x: position.x,
        y: position.y,
        z: position.z,
      },
      mesh: { color: mesh.color },
    });
  }

  const playerEntity = gameWorld
    .spawn()
    .add(Position)
    .add(Velocity)
    .add(Mesh, { color: 0xffffff * Math.random() })
    .add(NetworkEntity);

  const client = new Client(playerEntity, postMessage);

  port.addEventListener(
    "message",
    ({ data }: MessageEvent<ClientWorkerMessage>) => {
      client.onMessage(data);
    }
  );

  playerEntity.addNew(PlayerEntity, client);
  clients.add(client);

  const mesh = playerEntity.get(Mesh);
  const position = playerEntity.get(Position);
  postMessage({
    type: "spawnPlayer",
    id: playerEntity.id,
    mesh: { color: mesh.color },
    position: { x: position.x, y: position.y, z: position.z },
  });

  for (const [{ client: entityClient }] of playerEntities) {
    if (entityClient === client) continue;

    entityClient.postMessage({
      type: "spawnEntity",
      id: playerEntity.id,
      position: { x: position.x, y: position.y, z: position.z },
      mesh: { color: mesh.color },
    });
  }

  broadcast({
    type: "log",
    message: `New player joined (total: ${clients.size})`,
  });
  port.start();
});

setInterval(() => {
  update();
}, 1000 / 20);
