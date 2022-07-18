import { ClientDisconnectReason } from "../worker-op";
import type { Client, Manager } from "../types";

/**
 * Handles disconnect signals from a client.
 *
 * @param manager - The clients manager
 * @param client - The client that sent the Disconnect message
 */
export function onDisconnect(manager: Manager, client: Client): void {
  manager.removeClient(client, ClientDisconnectReason.Disconnect);
}
