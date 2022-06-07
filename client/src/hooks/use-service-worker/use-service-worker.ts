import { useEffect, useState } from "react";
import { Workbox } from "workbox-window";

/* c8 ignore next 4 */
// Path changes depending on the environment
const SERVICE_WORKER_PATH = import.meta.env.DEV
  ? "/src/service-worker.ts"
  : "/service-worker.js";

const workbox =
  "serviceWorker" in navigator
    ? new Workbox(SERVICE_WORKER_PATH, { scope: "/", type: "module" })
    : undefined;

void workbox?.register();

/**
 * Hook to check if there's a new pending version of the service worker,
 * and if so, returns a handler to activate it.
 *
 * @returns a handler to activate the new version of the service worker.
 *   Or undefined if there's no new version.
 */
export default function useServiceWorker(): (() => void) | undefined {
  const [updateHandler, setUpdateHandler] = useState<() => void>();

  useEffect(() => {
    const waitingHandler = (): void => {
      // Add a listener to reload the page when an updated service worker takes
      // control. This will force all tabs of the application to reload.
      workbox?.addEventListener("controlling", () => {
        window.location.reload();
      });

      const skipWaiting = (): void => {
        workbox?.messageSkipWaiting();
      };

      // Never pass a function directly to setState.
      setUpdateHandler(() => skipWaiting);
    };

    // Check if the service worker is already in "installed" state,
    // and that it would no longer trigger "waiting" events.
    // In which case, we directly call `waitingHandler()`
    void workbox?.getSW().then((sw) => {
      if (sw.state === "installed") {
        waitingHandler();
      } else {
        workbox.addEventListener("waiting", waitingHandler);
      }
    });

    return () => {
      workbox?.removeEventListener("waiting", waitingHandler);
    };
  }, []);

  return updateHandler;
}
