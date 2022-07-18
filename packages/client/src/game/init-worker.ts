import { DEFAULT_CLIENT_TIMEOUT } from "@qendil/client-common/game-worker";
import { WorkerOp } from "@qendil/client-common/game-worker/worker-op";

import type {
  ClientWorkerMessage,
  WorkerClientMessage,
} from "@qendil/client-common/game-worker";

/**
 * Definition of a function to send messages to the worker
 */
export type PostMessageCallback = (
  message: ClientWorkerMessage,
  transferable?: Transferable[]
) => void;

/**
 * Definition of a Game worker interface.
 */
export type GameWorker = {
  postMessage: PostMessageCallback;
  dispose: () => void;
};

/**
 * Definition of a function to handle received worker messages.
 */
export type GameWorkerCallback = (message: WorkerClientMessage) => void;

/**
 * Initialize the Game's shared worker.
 *
 * @param callback - Callback to call when receiving a new message
 * @returns A promise resolving to the GameWorker a worker interface
 */
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

    const serverTimeoutMs = DEFAULT_CLIENT_TIMEOUT;
    let timeoutPingHandler: ReturnType<typeof setTimeout> | undefined;

    const resetTimeoutPing = (): void => {
      if (timeoutPingHandler !== undefined) {
        clearTimeout(timeoutPingHandler);
      }

      setTimeout(() => {
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        postMessage([WorkerOp.Ping]);
      }, serverTimeoutMs / 2);
    };

    const postMessage: PostMessageCallback = (
      message,
      transferable?: Transferable[]
    ): void => {
      resetTimeoutPing();

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

    window.addEventListener("beforeunload", () => {
      postMessage([WorkerOp.Disconnect]);
      port.close();
    });

    port.addEventListener("message", messageHandler);
    port.start();
    resetTimeoutPing();

    resolve({ postMessage, dispose });
  });
}

/**
 *
 * @param callback - The callback to call when receiving a message
 * @returns A promise resolving to a worker interface
 */
export async function initWorker(
  callback: GameWorkerCallback
): Promise<GameWorker> {
  return initSharedWorker(callback);
}
