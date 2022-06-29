const loadedWasmFiles = new WeakMap<() => Promise<unknown>, unknown>();

/**
 * Hook that suspends the component until the given initializer has loaded.
 * @param initializer - The wasm initializer function
 */
export default function useWasm<T = unknown>(initializer: () => Promise<T>): T {
  if (!loadedWasmFiles.has(initializer)) {
    // eslint-disable-next-line @typescript-eslint/no-throw-literal
    throw initializer().then((exports) => {
      loadedWasmFiles.set(initializer, exports);
    });
  }

  return loadedWasmFiles.get(initializer) as T;
}
