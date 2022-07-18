import { WorkerOp } from "./worker-op";
import { onPing } from "./handlers/ping";
import { onDisconnect } from "./handlers/disconnect";

import type { Client, Manager } from "./types";

/**
 * Map of WorkerOp to functions to handle messages of that type.
 */
export const ClientWorkerOpMap = {
  [WorkerOp.Ping]: onPing,
  [WorkerOp.Disconnect]: onDisconnect,
};

// Utility alias
type OpMapKeys = keyof typeof ClientWorkerOpMap;

// Generate a ClientWorkerMessage for a given handler function
// It basically:
// Omits the 2 first arguments (Manager, Client)
// Prepends the corresponding WorkerOp key as a first parameter
// Puts the rest of the params in the tuple
type HandlerArgs<T extends OpMapKeys> = Parameters<
  typeof ClientWorkerOpMap[T]
> extends [Manager, Client, ...infer P extends any[]]
  ? [T, ...P]
  : [T];

/**
 * Automatically infers types of Client -> Worker messages
 * from the handlers map from `ClientWorkerOpMap`
 */
export type ClientWorkerMessage = {
  [P in OpMapKeys]: HandlerArgs<P>;
}[OpMapKeys];
