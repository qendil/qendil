import type { EcsManager } from "@qendil/client-common/ecs";

// TODO: Make this easily extendable
type WorkerClientMessage = { type: "pong" } | { type: "log"; message: string };
type ClientWorkerMessage = { type: "ping" } | { type: "disconnect" };

type PostMessageCallback = (
  message: ClientWorkerMessage,
  transferable?: Transferable[]
) => void;

type ClientConnection = {
  postMessage: PostMessageCallback;
  dispose: () => void;
};

function handleMessage(
  message: WorkerClientMessage,
  _postMessage: PostMessageCallback,
  _manager: EcsManager
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
