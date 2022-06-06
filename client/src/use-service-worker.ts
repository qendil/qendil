import { useEffect, useState } from "react";
import { Workbox } from "workbox-window";

// The service worker path changes depending on the environment
const SERVICE_WORKER_PATH = import.meta.env.DEV
  ? "/src/service-worker.ts"
  : "/service-worker.js";

const workbox =
  "serviceWorker" in navigator
    ? new Workbox(SERVICE_WORKER_PATH, { scope: "/", type: "module" })
    : undefined;

void workbox?.register();

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
