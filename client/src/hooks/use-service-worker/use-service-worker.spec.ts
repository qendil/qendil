import { act, renderHook } from "@testing-library/react";

import { Workbox } from "workbox-window";
vi.mock("workbox-window", () => {
  const mockedWorkbox = vi.fn(() => {
    // Nothing to do here
  });

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  mockedWorkbox.prototype.register = vi.fn();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  mockedWorkbox.prototype.addEventListener = vi.fn();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  mockedWorkbox.prototype.removeEventListener = vi.fn();

  return { Workbox: mockedWorkbox };
});

// Navigator is read-only, here we force it to be writable
Object.defineProperty(globalThis, "navigator", {
  value: { ...navigator },
  writable: true,
});

Object.defineProperty(globalThis, "location", {
  configurable: true,
  value: { reload: vi.fn() },
});

// Enable service workers by default for this test
// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
(globalThis.navigator as any).serviceWorker = {};

// We finally import use-service-worker because it runs some code
import useServiceWorker from "./use-service-worker";

describe("useServiceWorker module", () => {
  it("registers a service worker when imported if they are supported", async () => {
    // Given an environment where service workers are supported
    // When I import `use-service-worker`
    // Then the service worker is registered

    expect(navigator.serviceWorker).toBeDefined();

    vi.resetModules();
    await import("./use-service-worker");

    const { Workbox: mockedWorkbox } = await import("workbox-window");
    expect(mockedWorkbox.prototype.register).toHaveBeenCalledOnce();
  });

  it("doesn't register a service worker when imported if they're not supported", async () => {
    // Given an environment where service workers are not supported
    // When I import `use-service-worker`
    // Then the service worker is not registered

    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    delete (globalThis.navigator as any).serviceWorker;

    vi.resetModules();
    await import("./use-service-worker");

    const { Workbox: mockedWorkbox } = await import("workbox-window");
    expect(mockedWorkbox.prototype.register).not.toHaveBeenCalled();
  });
});

describe("useServiceWorker hook", () => {
  afterEach(() => {
    Workbox.prototype.addEventListener = vi.fn();
    Workbox.prototype.getSW = vi.fn();
  });

  it("sets an update handler if there's already a new version", async () => {
    // Given a service worker that's on the `installed` state
    // When I mount `useServiceWorker`
    // Then we should directly set an update handler

    Workbox.prototype.getSW = vi.fn().mockResolvedValue({ state: "installed" });

    const { result } = renderHook(() => useServiceWorker());
    await act(async () => new Promise(process.nextTick));

    expect(result.current).toBeDefined();
  });

  it("sets an update handler when a new version is ready", async () => {
    // Given a service worker in the pending state
    // And a mounted `useServiceWorker` hook
    // When the service worker triggers the `waiting` listener
    // Then the `useServiceWorker` hook should set an update handler

    let waitingListener: (() => void) | undefined;

    Workbox.prototype.getSW = vi
      .fn()
      .mockResolvedValue({ state: "installing" });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (Workbox.prototype.addEventListener as any) = vi.fn(
      (event: string, listener: () => void): void => {
        if (event === "waiting") {
          waitingListener = listener;
        }
      }
    );

    const { result } = renderHook(() => useServiceWorker());
    await act(async () => new Promise(process.nextTick));

    expect(waitingListener).toBeDefined();
    expect(result.current).toBeUndefined();

    // Trigger the waiting listener
    act(() => waitingListener?.());

    expect(result.current).toBeDefined();
  });

  it("the update handler asks the service worker to skip waiting", async () => {
    // Given a useServiceWorker hook with a set update handler
    // When I call the update handler
    // Then we should send a skip waiting message to the service worker

    Workbox.prototype.getSW = vi.fn().mockResolvedValue({ state: "installed" });
    Workbox.prototype.messageSkipWaiting = vi.fn();

    const { result } = renderHook(() => useServiceWorker());
    await act(async () => new Promise(process.nextTick));

    expect(result.current).toBeDefined();

    result.current?.();
    expect(Workbox.prototype.messageSkipWaiting).toHaveBeenCalled();
  });

  it("reloads the page when the service worker activates after prompt", async () => {
    // Given a service worker that's ready to activate
    // When I call the update handler
    // And the service worker activates
    // Then the page should reload

    Workbox.prototype.getSW = vi.fn().mockResolvedValue({ state: "installed" });
    Workbox.prototype.messageSkipWaiting = vi.fn();

    let controllingListener: (() => void) | undefined;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (Workbox.prototype.addEventListener as any) = vi.fn(
      (event: string, listener: () => void): void => {
        if (event === "controlling") {
          controllingListener = listener;
        }
      }
    );

    const { result } = renderHook(() => useServiceWorker());
    await act(async () => new Promise(process.nextTick));

    expect(result.current).toBeDefined();

    result.current?.();
    expect(controllingListener).toBeDefined();

    controllingListener?.();
    expect(window.location.reload).toHaveBeenCalled();
  });
});
