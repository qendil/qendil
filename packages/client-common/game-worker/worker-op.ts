/**
 * List of all operations (incoming or ongoing) that can be handled by
 * either the
 */
export enum WorkerOp {
  Ping = 1,
  Pong = 2,

  Disconnect = 10,

  ListWorlds = 1000,
  WorldInfo = 1001,
  CreateWorld = 1002,
}

/**
 * Reasons for disconnecting a client
 */
export enum ClientDisconnectReason {
  Disconnect = 0,
  Kicked = 1,
  Timeout = 2,
}
