import { NavigationRoute, registerRoute } from "workbox-routing";
import type { PrecacheEntry } from "workbox-precaching";
import {
  cleanupOutdatedCaches,
  matchPrecache,
  precacheAndRoute,
} from "workbox-precaching";

// Some typescript declaraions
declare let self: ServiceWorkerGlobalScope;
declare const __WB_MANIFEST: Array<PrecacheEntry | string>;

if (import.meta.env.DEV) {
  // In dev mod, immediately enable the service worker but don't precache anything.
  self.addEventListener("install", () => {
    console.debug("Precaching is disabled in development mode");
    void self.skipWaiting();
  });
} else {
  self.addEventListener("message", (event) => {
    const { data } = event as { data?: { type: string } };

    if (data?.type === "SKIP_WAITING") {
      void self.skipWaiting();
    }
  });

  // Removes incompatible caches that were created by older versions of workbox.
  cleanupOutdatedCaches();

  // Precache all the files emitted by vitejs.
  precacheAndRoute(__WB_MANIFEST);

  // This is to allow react-router to work in offline mode,
  // by redirecting all unknown routes to the index.html page.
  registerRoute(
    new NavigationRoute(async ({ request }) => {
      const cached = await matchPrecache(request.url);
      if (cached !== undefined) {
        return cached;
      }

      const fallback = await matchPrecache("/index.html");
      if (fallback === undefined) {
        throw new Error("Index page was not cached.");
      }

      return fallback;
    })
  );
}
