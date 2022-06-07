/**
 * Workaround for conflicting Webworker types in vitest's Node scope.
 */

/// <reference no-default-lib="true"/>

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions, unicorn/prevent-abbreviations
declare interface ImportMetaEnv {
  DEV: boolean;
  PROD: boolean;
  environment: "development" | "production";
}

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
declare interface ImportMeta {
  readonly env: ImportMetaEnv;
}
