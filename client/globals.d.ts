declare const __APP_NAME__: string;
declare const __APP_VERSION__: string;

// Prefixed fullscreen APIs
declare interface Document {
  mozCancelFullScreen?: () => Promise<void>;
  mozExitFullscreen?: () => Promise<void>;
  msExitFullscreen?: () => Promise<void>;
  webkitExitFullscreen?: () => Promise<void>;
  mozFullScreenElement?: Element;
  mozFullscreenElement?: Element;
  msFullscreenElement?: Element;
  webkitFullscreenElement?: Element;
}
declare interface HTMLElement {
  msRequestFullscreen?: () => Promise<void>;
  mozRequestFullscreen?: () => Promise<void>;
  mozRequestFullScreen?: () => Promise<void>;
  webkitRequestFullscreen?: () => Promise<void>;
}
