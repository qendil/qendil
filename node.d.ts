/**
 * Workaround to silence missing Webworker types in a Node scope.
 * VitePWA indirectly imports workbox-core, which uses Webworker types
 */

declare type ExtendableEvent = unknown;
declare type Request = unknown;
declare type RequestInit = unknown;
declare type Response = unknown;
declare type WorkerType = unknown;
declare type CacheQueryOptions = unknown;
declare type ServiceWorkerRegistration = unknown;

declare namespace WebAssembly {
  type Module = unknown;
}
