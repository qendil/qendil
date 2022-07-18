import type { WorkerClientMessage } from "./worker-client-message";
import type { ClientDisconnectReason } from "./worker-op";

export type PostMessageCallback<T = any> = (
  message: WorkerClientMessage,
  transferable?: T[]
) => void;

/**
 * Abstract definition of a Client
 */
export abstract class Client<TManager extends Manager = Manager> {
  public constructor(
    protected readonly manager: TManager,
    public readonly postMessage: PostMessageCallback
  ) {}
}

/**
 * Abstract definition of a Client manager
 */
export abstract class Manager {
  protected readonly clients = new Set<Client>();

  /**
   * Broadcast a message to all active clients.
   *
   * @param args - Args to pass to .postMessage() of each client
   */
  public broadcast(...args: Parameters<PostMessageCallback>): void {
    for (const client of this.clients) {
      client.postMessage(...args);
    }
  }

  /**
   * Remove a client from the manager.
   *
   * @param client - Client to remove
   * @param reason - Reason of removal
   */
  public abstract removeClient(
    client: Client,
    reason: ClientDisconnectReason
  ): void;
}
