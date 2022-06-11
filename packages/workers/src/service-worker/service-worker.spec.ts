describe("Service worker", () => {
  const originalEnvironment = import.meta.env;

  afterEach(() => {
    (import.meta.env as any) = originalEnvironment;
  });

  it("should handle `SKIP_WAITING` message", async () => {
    // Given a service worker
    // When the service worker receives a `SKIP_WAITING` message
    // Then the service worker should skip waiting

    vi.resetModules();
    (import.meta.env as any) = { DEV: false, PROD: true, MODE: "production" };

    const mockSkipWaiting = vi.fn();
    vi.stubGlobal("skipWaiting", mockSkipWaiting);

    type EventType = { data?: { type: string } };
    const messageListeners = new Set<(event: EventType) => void>();
    vi.stubGlobal(
      "addEventListener",
      vi.fn((event: string, listener: unknown) => {
        if (event === "message") {
          messageListeners.add(listener as (event: EventType) => void);
        }
      })
    );

    await import("./service-worker");
    expect(messageListeners.size).toBeGreaterThan(0);

    for (const listener of messageListeners) {
      listener({ data: { type: "SKIP_WAITING" } });
    }

    expect(mockSkipWaiting).toHaveBeenCalled();
  });

  it("should immediately skip waiting in development environment", async () => {
    // Given a service worker
    // And we're in the development environment
    // When the service worker is installed
    // Then the service worker should skip waiting

    vi.resetModules();
    (import.meta.env as any) = { DEV: true, PROD: false, MODE: "development" };

    const mockSkipWaiting = vi.fn();
    vi.stubGlobal("skipWaiting", mockSkipWaiting);

    const installListeners = new Set<() => void>();
    vi.stubGlobal(
      "addEventListener",
      vi.fn((event: string, listener: unknown) => {
        if (event === "install") {
          installListeners.add(listener as () => void);
        }
      })
    );

    await import("./service-worker");

    await import("./service-worker");
    expect(installListeners.size).toBeGreaterThan(0);

    for (const listener of installListeners) {
      listener();
    }

    expect(mockSkipWaiting).toHaveBeenCalled();
  });
});

export {};
