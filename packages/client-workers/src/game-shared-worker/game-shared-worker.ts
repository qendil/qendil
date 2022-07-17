import GameWorker, { WorkerClient } from "@qendil/client-common/game-worker";

import type {
  PostMessageCallback,
  ClientWorkerMessage,
} from "@qendil/client-common/game-worker";

declare let self: SharedWorkerGlobalScope;

const gameWorker = new GameWorker();

self.addEventListener("connect", (connectEvent) => {
  const [port] = connectEvent.ports;
  if (!port) return;

  const postMessage: PostMessageCallback = (
    message,
    transferable?: Transferable[]
  ) => {
    if (transferable) {
      port.postMessage(message, transferable);
    } else {
      port.postMessage(message);
    }
  };

  const client = new WorkerClient(postMessage);
  gameWorker.addClient(client);

  port.addEventListener(
    "message",
    (event: MessageEvent<ClientWorkerMessage>) => {
      const { data } = event;
      gameWorker.onMessage(data, client);
    }
  );

  port.start();
});
