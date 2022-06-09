declare const __APP_NAME__: string;
declare const __APP_VERSION__: string;
declare const __APP_PLATFORM__:
  | "browser"
  | "cdv-android"
  | "cdv-ios"
  | "cdv-linux"
  | "cdv-macos"
  | "cdv-windows";
declare const __SENTRY_DSN__: string | undefined;
declare const __SENTRY_ENVIRONMENT__: string;

// Prefixed fullscreen APIs
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
declare interface Document {
  mozCancelFullScreen?: () => Promise<void>;
  mozExitFullscreen?: () => Promise<void>;
  mozFullScreenElement?: Element;
  mozFullscreenElement?: Element;
  msExitFullscreen?: () => Promise<void>;
  msFullscreenElement?: Element;
  webkitExitFullscreen?: () => Promise<void>;
  webkitFullscreenElement?: Element;
}
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
declare interface HTMLElement {
  mozRequestFullScreen?: () => Promise<void>;
  mozRequestFullscreen?: () => Promise<void>;
  msRequestFullscreen?: () => Promise<void>;
  webkitRequestFullscreen?: () => Promise<void>;
}
