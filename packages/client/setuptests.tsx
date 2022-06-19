/* eslint-disable @typescript-eslint/consistent-indexed-object-style */
/* eslint-disable @typescript-eslint/consistent-type-definitions */
/* eslint-disable @typescript-eslint/no-empty-interface */

import "@testing-library/jest-dom/dist/extend-expect";

import type { TestingLibraryMatchers } from "@testing-library/jest-dom/matchers";
import type { SpyInstance } from "vitest";

/**
 * A utility function to mock a class and all of its methods.
 *
 * @param constructor - The class to mock
 * @returns A mocked version of the class
 */
global._mockClass = <T extends unknown[], R, C extends new (...args: T) => R>(
  constructor: C
): SpyInstance<T, R> => {
  // Create a mock constructor, that's "newable"
  const ClassMock = vi.fn<T, R>((...args) => new constructor(...args));

  // Copy the original class as not to mutate it
  const ClassCopy = Object.create(
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    Object.getPrototypeOf(constructor),
    Object.getOwnPropertyDescriptors(constructor)
  ) as C;

  const { prototype } = ClassCopy;

  // For each method of the original class, create a mock
  for (const property of Object.getOwnPropertyNames(prototype)) {
    // Turn each of the methods into a mock
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument
    prototype[property] = vi.fn(prototype[property]);

    // Affect the methods to the prototype to make them accessible from outside
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    ClassMock.prototype[property] = prototype[property];
  }

  return ClassMock;
};

vi.mock("three", async () => {
  const threeModule = await import("three");

  class WebGLRendererDummy {
    public domElement: HTMLCanvasElement;
    private readonly context = new WebGL2RenderingContext();

    public constructor() {
      this.domElement = document.createElement("canvas");
      this.domElement.dataset._source = "renderer";
    }

    public setSize(width: number, height: number): void {
      this.domElement.width = width;
      this.domElement.height = height;
    }

    public setViewport(): void {
      // Nothing to do
    }

    public render(): void {
      // Nothing to do
    }

    public getClearAlpha(): number {
      return 1;
    }

    public getContext(): unknown {
      return this.context;
    }

    public dispose(): void {
      // Nothing to do
    }
  }

  return {
    ...threeModule,
    WebGLRenderer: _mockClass(WebGLRendererDummy),
  };
});

declare global {
  function _mockClass<T extends unknown[], R, C extends new (...args: T) => R>(
    constructor: C
  ): SpyInstance<T, R>;

  // Add jest-dom matchers to vitest's assertions
  namespace Vi {
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
