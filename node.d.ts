/**
 * Workaround to silence missing Webworker types in a Node scope.
 * VitePWA indirectly imports workbox-core, which uses Webworker types
 */

/// <reference no-default-lib="true"/>

declare type ExtendableEvent = unknown;
declare type Request = { url: string };
declare type RequestInit = unknown;
declare type Response = unknown;
declare type WorkerType = unknown;
declare type CacheQueryOptions = unknown;
declare type ServiceWorkerRegistration = unknown;
declare type FetchEvent = unknown;
declare type RequestInfo = unknown;

declare namespace WebAssembly {
  type Module = unknown;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ExtendableMessageEvent = { data: any };

type EventTypeMap = {
  [key: string]: ExtendableEvent;
  message: ExtendableMessageEvent;
};

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
declare interface ServiceWorkerGlobalScope {
  addEventListener: <T extends keyof EventTypeMap>(
    eventType: T,
    listener: (event: EventTypeMap[T]) => void
  ) => void;
  skipWaiting: () => void;
}
