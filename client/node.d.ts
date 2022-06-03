/**
 * Workaround to avoid type conflict on typescript 4.7
 *
 * VitePWA indirectly imports workbox-core
 * workbox-core needs ExtendableEvent from `WebWorker` types
 * `WebWorker` types conflict with `@types/node` since typescript 4.7
 */
declare type ExtendableEvent = unknown;
