// Some typescript declaraions
declare let self: SharedWorkerGlobalScope;

// TODO: Have a single codebae for these
type WorkerClientMessage = { type: "pong" } | { type: "log"; message: string };
type ClientWorkerMessage = { type: "ping" } | { type: "disconnect" };

type PostMessageCallback = (
  message: WorkerClientMessage,
  transferable?: Transferable[]
) => void;

class Client {
  public readonly postMessage: PostMessageCallback;

  public constructor(postMessage: PostMessageCallback) {
    this.postMessage = postMessage;
  }

  public onMessage(message: ClientWorkerMessage): void {
    switch (message.type) {
      case "ping": {
        this.postMessage({ type: "pong" });
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

const clients = new Set();

self.addEventListener("connect", (connectEvent) => {
  const [port] = connectEvent.ports;
  if (!port) return;

  const client = new Client((message, transferable) => {
    if (transferable) {
      port.postMessage(message, transferable);
    } else {
      port.postMessage(message);
    }
  });

  port.addEventListener(
    "message",
    ({ data }: MessageEvent<ClientWorkerMessage>) => {
      client.onMessage(data);
    }
  );

  clients.add(client);

  port.start();
});

export {};
