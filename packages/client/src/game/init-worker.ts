import type { EcsEntity, EcsManager } from "@qendil/client-common/ecs";
import { Mesh } from "./components/mesh";
import { Position } from "./components/position";
import { SmoothPosition } from "./components/smooth-position";
import { ThirdPersonController } from "./components/third-person-controller";

// TODO: Make this easily extendable
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

export type PostMessageCallback = (
  message: ClientWorkerMessage,
  transferable?: Transferable[]
) => void;

type ClientConnection = {
  postMessage: PostMessageCallback;
  dispose: () => void;
};

const workerEntities = new Map<number, EcsEntity>();

function handleMessage(
  message: WorkerClientMessage,
  _postMessage: PostMessageCallback,
  manager: EcsManager
): void {
  switch (message.type) {
    case "pong": {
      console.log("World worker sent PONG");
      break;
    }

    case "log": {
      console.log("World worker:", message.message);
      break;
    }

    case "spawnPlayer": {
      const player = manager
        .spawn()
        .add(Mesh, message.mesh)
        .add(Position, message.position)
        .add(SmoothPosition)
        .add(ThirdPersonController);

      workerEntities.set(message.id, player);

      break;
    }

    case "updateEntityPosition": {
      const entity = workerEntities.get(message.id);
      if (entity) {
        const position = entity.get(Position);
        const { x, y, z } = message.position;
        position.x = x;
        position.y = y;
        position.z = z;
      }

      break;
    }

    case "spawnEntity": {
      const entity = manager
        .spawn()
        .add(Position, message.position)
        .add(Mesh, message.mesh)
        .add(SmoothPosition);
      workerEntities.set(message.id, entity);
      break;
    }

    default:
      console.log(message);
  }
}

export default async function initWorker(
  manager: EcsManager
): Promise<ClientConnection> {
  return new Promise((resolve, reject) => {
    const worker = new SharedWorker(new URL("world-worker", import.meta.url), {
      type: "module",
    });

    worker.addEventListener("error", () => {
      reject(new Error("Could not start shared worker"));
    });

    const { port } = worker;

    const postMessage = (
      message: ClientWorkerMessage,
      transferable?: Transferable[]
    ): void => {
      if (transferable) {
        port.postMessage(message, transferable);
      } else {
        port.postMessage(message);
      }
    };

    const messageHandler = (event: MessageEvent<WorkerClientMessage>): void => {
      const { data } = event;
      handleMessage(data, postMessage, manager);
    };

    const dispose = (): void => {
      postMessage({ type: "disconnect" });

      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      port.removeEventListener("message", initialMessageHandler);
      port.removeEventListener("message", messageHandler);
    };

    const initialMessageHandler = (): void => {
      port.removeEventListener("message", initialMessageHandler);

      resolve({ postMessage, dispose });
    };

    port.addEventListener("message", initialMessageHandler);
    port.addEventListener("message", messageHandler);

    postMessage({ type: "ping" });
    port.start();
  });
}
