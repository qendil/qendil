import type { ClientDisconnectReason, WorkerOp } from "./worker-op";

/**
 * Messages that the client accepts from a worker.
 */
export type WorkerClientMessage =
  | [WorkerOp.Pong]
  | [WorkerOp.Disconnect, ClientDisconnectReason];
