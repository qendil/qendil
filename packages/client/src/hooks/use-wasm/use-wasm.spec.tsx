import useWasm from "./use-wasm";
import { act, renderHook } from "@testing-library/react";
import { Suspense } from "react";

describe("useWasm hook", () => {
  it("prevents component from rendering until the wasm initializer resolves", async () => {
    // Given a component that uses useWasm
    // When I try to render the component
    // Then the suspense fallback should render instead
    // When I wait for the wasm initializer to resolve
    // Then the component should render correctly

    // eslint-disable-next-line @typescript-eslint/require-await
    const dummyInitializer = vi.fn(async () => 42);

    const { result } = renderHook(() => useWasm(dummyInitializer), {
      wrapper: ({ children }) => <Suspense>{children}</Suspense>,
    });

    expect(result.current).toBeNull();

    await act(async () => new Promise(process.nextTick));

    expect(result.current).toBe(42);
  });

  it("works even if the initializer returns undefined", async () => {
    // Given a component that uses useWasm
    // And a wasm initializer that resolves to undefined
    // When I try to render the component
    // Then the suspense fallback should render instead
    // When I wait for the wasm initializer to resolve
    // Then the component should render correctly

    const dummyInitializer = vi.fn(async () => {
      // Resolves to undefined
    });

    const { result } = renderHook(() => useWasm(dummyInitializer), {
      wrapper: ({ children }) => <Suspense>{children}</Suspense>,
    });

    expect(result.current).toBeNull();

    await act(async () => new Promise(process.nextTick));

    expect(result.current).toBe(undefined);
  });
});
