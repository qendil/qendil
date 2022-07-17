import type {
  WorkerClientMessage,
  PostMessageCallback,
} from "@qendil/client-common/game-worker";

type GameWorker = {
  postMessage: PostMessageCallback;
  dispose: () => void;
};

type GameWorkerCallback = (message: WorkerClientMessage) => void;

async function initSharedWorker(
  callback: GameWorkerCallback
): Promise<GameWorker> {
  return new Promise((resolve, reject): void => {
    const worker = new SharedWorker(
      new URL("game-shared-worker", import.meta.url),
      { type: "module", name: "Game shared worker" }
    );

    worker.addEventListener("error", () => {
      reject(new Error("Could not start the game's shared worker"));
    });

    const { port } = worker;

    const postMessage: PostMessageCallback = (
      message,
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
      callback(data);
    };

    const dispose = (): void => {
      port.removeEventListener("message", messageHandler);
    };

    port.addEventListener("message", messageHandler);
    port.start();

    resolve({ postMessage, dispose });
  });
}

export async function initWorker(
  callback: GameWorkerCallback
): Promise<GameWorker> {
  return initSharedWorker(callback);
}
