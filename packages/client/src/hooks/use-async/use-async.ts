const loadedWasmFiles = new WeakMap<() => Promise<unknown>, unknown>();

/**
 * Hook that suspends the component until the given initializer has loaded.
 * @param initializer - The wasm initializer function
 * @returns The result of the initializer
 */
export default function useAsync<T = unknown>(
  initializer: () => Promise<T>
): T {
  if (loadedWasmFiles.has(initializer)) {
    return loadedWasmFiles.get(initializer) as T;
  }

  // eslint-disable-next-line @typescript-eslint/no-throw-literal
  throw initializer().then((exports) => {
    loadedWasmFiles.set(initializer, exports);
  });
}
