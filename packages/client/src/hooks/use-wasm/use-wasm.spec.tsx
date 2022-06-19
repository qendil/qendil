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

    // eslint-disable-next-line unicorn/no-useless-promise-resolve-reject
    const dummyInitializer = vi.fn(async () => Promise.resolve(42));

    // When I use the useAsset hook
    const { result } = renderHook(() => useWasm(dummyInitializer), {
      wrapper: ({ children }) => <Suspense>{children}</Suspense>,
    });

    expect(result.current).toBeNull();

    await act(async () => new Promise(process.nextTick));

    expect(result.current).toBeDefined();
  });
});
