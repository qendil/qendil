import { ClientWorkerOpMap } from "./client-worker-message";
import { Manager } from "./types";
import { ClientDisconnectReason, WorkerOp } from "./worker-op";

import type WorkerClient from "./worker-client";
import type { ClientWorkerMessage } from "./client-worker-message";

export const DEFAULT_CLIENT_TIMEOUT = 30_000;

/**
 * Manages World instances
 * and acts as a middleman between Game instances and Clients.
 */
export default class GameWorker extends Manager {
  public readonly clientTimeoutMs = DEFAULT_CLIENT_TIMEOUT;

  /**
   * Add a client to the worker.
   *
   * @param client - Client to add.
   */
  public addClient(client: WorkerClient): void {
    this.clients.add(client);
    client.resetTimeout();

    console.debug("New client. total:", this.clients.size);
  }

  /**
   * Callback for when a message is received.
   *
   * @param message - received message
   * @param client - client that sent the message
   */
  public onMessage(message: ClientWorkerMessage, client: WorkerClient): void {
    const [operation, ...args] = message;
    client.resetTimeout();

    const handler = ClientWorkerOpMap[operation];
    handler(this, client, ...args);
  }

  /**
   * Remove a client from the worker.
   *
   * @param client - Client to remove the client
   * @param reason - Reason to remove the client
   */
  public removeClient(
    client: WorkerClient,
    reason: ClientDisconnectReason
  ): void {
    if (reason !== ClientDisconnectReason.Timeout) {
      client.postMessage([WorkerOp.Disconnect, reason]);
    }

    this.clients.delete(client);
    client.dispose();

    console.debug("removed client. total:", this.clients.size);
  }
}
