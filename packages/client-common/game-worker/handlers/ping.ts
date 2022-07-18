import { WorkerOp } from "../worker-op";
import type { Client, Manager } from "../types";

/**
 * Handles PING messages from the client.
 *
 * @param manager - The manager instance
 * @param client - The client that sent the message
 */
export function onPing(manager: Manager, client: Client): void {
  console.debug("Pinged");

  client.postMessage([WorkerOp.Pong]);
}
