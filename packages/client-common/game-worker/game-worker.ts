export type ClientWorkerMessage = {
  // TODO
};

export type WorkerClientMessage = {
  // TODO
};

export type PostMessageCallback<T = any> = (
  message: WorkerClientMessage,
  transferable?: T[]
) => void;

export class WorkerClient {
  public constructor(public readonly postMessage: PostMessageCallback) {}
}

export default class GameWorker {
  private readonly clients = new Set<WorkerClient>();

  public addClient(client: WorkerClient): void {
    this.clients.add(client);
  }

  public onMessage(_message: ClientWorkerMessage, _client: WorkerClient): void {
    // TODO
  }
}
