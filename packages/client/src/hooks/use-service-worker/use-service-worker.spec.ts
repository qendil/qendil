import { act, renderHook } from "@testing-library/react";

import { Workbox } from "workbox-window";
vi.mock("workbox-window", () => {
  class WorkboxDummy {
    public register(): void {
      // Nothing to do
    }

    public addEventListener(): void {
      // Nothing to do
    }

    public removeEventListener(): void {
      // Nothing to do
    }

    public getSW(): void {
      // Nothing to do
    }

    public messageSkipWaiting(): void {
      // Nothing to do
    }
  }

  return { Workbox: _mockClass(WorkboxDummy) };
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
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
(globalThis.navigator as any).serviceWorker = {};

// We finally import use-service-worker because it runs some code
import useServiceWorker from "./use-service-worker";

beforeEach(() => {
  vi.stubGlobal("__APP_PLATFORM__", "browser");
});

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

  it("only registers service workers when they're supported", async () => {
    // Given an environment where service workers are not supported
    // When I import `use-service-worker`
    // Then the service worker should not be registered

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    delete (globalThis.navigator as any).serviceWorker;

    vi.resetModules();
    await import("./use-service-worker");

    const { Workbox: mockedWorkbox } = await import("workbox-window");
    expect(mockedWorkbox.prototype.register).not.toHaveBeenCalled();
  });

  it("only registers service workers when on the browser", async () => {
    // Given a non-browser environment
    // When I import `use-service-worker`
    // Then the service worker should not be registered

    vi.stubGlobal("__APP_PLATFORM__", "cdv-android");

    vi.resetModules();
    await import("./use-service-worker");

    const { Workbox: mockedWorkbox } = await import("workbox-window");
    expect(mockedWorkbox.prototype.register).not.toHaveBeenCalled();
  });
});

describe("useServiceWorker hook", () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it("sets an update handler if there's already a new version", async () => {
    // Given a service worker that's on the `installed` state
    // When I mount `useServiceWorker`
    // Then we should directly set an update handler

    vi.mocked(Workbox.prototype.getSW).mockResolvedValue({
      state: "installed",
    } as ServiceWorker);

    const { result } = renderHook(() => useServiceWorker());
    await act(async () => new Promise(process.nextTick));

    expect(result.current).toBeDefined();
  });

  it("sets an update handler when a new version is ready", async () => {
    // Given a service worker in the pending state
    // And a mounted `useServiceWorker` hook
    // When the service worker triggers the `waiting` listener
    // Then the `useServiceWorker` hook should set an update handler

    vi.mocked(Workbox.prototype.getSW).mockResolvedValue({
      state: "installing",
    } as ServiceWorker);

    let waitingListener: (() => void) | undefined;
    vi.mocked(Workbox.prototype.addEventListener).mockImplementation(
      (event, listener) => {
        if (event === "waiting") {
          waitingListener = listener as () => void;
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

    vi.mocked(Workbox.prototype.getSW).mockResolvedValue({
      state: "installed",
    } as ServiceWorker);
    const mockMessageSkipWaiting = vi.mocked(
      Workbox.prototype.messageSkipWaiting
    );

    const { result } = renderHook(() => useServiceWorker());
    await act(async () => new Promise(process.nextTick));

    expect(result.current).toBeDefined();

    mockMessageSkipWaiting.mockClear();
    result.current?.();
    expect(mockMessageSkipWaiting).toHaveBeenCalled();
  });

  it("reloads the page when the service worker activates after prompt", async () => {
    // Given a service worker that's ready to activate
    // When I call the update handler
    // And the service worker activates
    // Then the page should reload

    vi.mocked(Workbox.prototype.getSW).mockResolvedValue({
      state: "installed",
    } as ServiceWorker);

    let controllingListener: (() => void) | undefined;
    vi.mocked(Workbox.prototype.addEventListener).mockImplementation(
      (event, listener): void => {
        if (event === "controlling") {
          controllingListener = listener as () => void;
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
