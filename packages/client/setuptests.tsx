/* eslint-disable @typescript-eslint/consistent-indexed-object-style */
/* eslint-disable @typescript-eslint/consistent-type-definitions */
/* eslint-disable @typescript-eslint/no-empty-interface */

import type { TestingLibraryMatchers } from "@testing-library/jest-dom/matchers";

declare global {
  // Add jest-dom matchers to vitest's assertions
  namespace Vi {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    interface Assertion<T = any>
      extends TestingLibraryMatchers<typeof expect.stringContaining, T> {}
  }
}

declare module "vitest" {
  // Allow vitest's TestContext to have custom attributes
  interface TestContext {
    [key: string]: unknown;
  }
}
