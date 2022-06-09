import * as sentry from "./sentry";
import * as sentryReact from "@sentry/react";

vi.mock("@sentry/react", () => ({
  init: vi.fn(),
}));

describe("Sentry utilities", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("sets up sentry asynchronously with the right parameters", async () => {
    // Given nothing
    // When I call `sentry.setup()`
    // Then sentry should not be initialized immediately
    // When I wait for it to be initialized
    // Then it should be initialized with the correct parameters

    import.meta.env.CLIENT_SENTRY_ENVIRONMENT = "testing";
    vi.stubGlobal("__APP_VERSION__", "1.0.0");
    vi.stubGlobal("__APP_PLATFORM__", "browser");
    vi.stubGlobal("__SENTRY_DSN__", "https://example.com/123456789");
    vi.stubGlobal("__SENTRY_ENVIRONMENT__", "testing");

    const promise = sentry.setup();
    expect(sentryReact.init).not.toHaveBeenCalled();

    await promise;
    expect(sentryReact.init).toHaveBeenCalledWith({
      dsn: "https://example.com/123456789",
      release: "client@1.0.0",
      environment: "testing",
      initialScope: {
        tags: { platform: "browser" },
      },
    });
  });
});
