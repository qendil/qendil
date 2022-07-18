import { Client } from "./types";
import { ClientDisconnectReason } from "./worker-op";

import type GameWorker from "./game-worker";
import type { PostMessageCallback } from "./types";

/**
 * Represents a client that's connected to the worker
 */
export default class WorkerClient extends Client<GameWorker> {
  private timeoutHandler: ReturnType<typeof setTimeout> | undefined;

  public constructor(manager: GameWorker, postMessage: PostMessageCallback) {
    super(manager, postMessage);
  }

  /**
   * Starts/reset disconnection timeout.
   */
  public resetTimeout(): void {
    if (this.timeoutHandler !== undefined) {
      clearTimeout(this.timeoutHandler);
    }

    this.timeoutHandler = setTimeout(() => {
      this.manager.removeClient(this, ClientDisconnectReason.Timeout);
    }, this.manager.clientTimeoutMs);
  }

  /**
   * Cleans up resources created by this client.
   */
  public dispose(): void {
    if (this.timeoutHandler !== undefined) {
      clearTimeout(this.timeoutHandler);
      this.timeoutHandler = undefined;
    }
  }
}
