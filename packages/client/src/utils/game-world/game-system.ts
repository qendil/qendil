export type GameSystem<T extends unknown[], R> = {
  (...args: T): R;
  dispose: () => void;
};
