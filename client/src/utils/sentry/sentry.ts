/**
 * Loads and sets sentry up asynchronously.
 */
export async function setup(): Promise<void> {
  const sentry = await import("@sentry/react");

  const dsn = __SENTRY_DSN__;
  const release = `client@${__APP_VERSION__}`;
  const environment = __SENTRY_ENVIRONMENT__;

  sentry.init({
    dsn,
    release,
    environment,
    initialScope: {
      tags: { platform: __APP_PLATFORM__ },
    },
  });
}
