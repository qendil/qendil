import type {
  ThreeViewInitalizerOptions,
  ThreeViewOptions,
} from "../use-three-view";
import useThreeView from "../use-three-view";

export type GameViewOptions = ThreeViewOptions & {
  /**
   * The framerate of the fixed update in seconds, defaults to 1/50.
   */
  fixedUpdateRate?: number;

  /**
   * Called every fixed amount of time, disregarding the framerate.
   */
  onFixedUpdate?: (frametime: number) => void;
};

export type GameViewInitializerOptions = ThreeViewInitalizerOptions;

export type GameViewInitializer = (
  options: GameViewInitializerOptions
) => GameViewOptions | undefined;

/**
 *
 * @param initalizer - The function to initialize the game view.
 * @param deps - Variables that cause the game view to re-render when changed.
 * @returns A component to display the created scene.
 */
export default function useGameView(
  initalizer: GameViewInitializer,
  deps: unknown[]
): ReturnType<typeof useThreeView> {
  return useThreeView((threeInitializerOptions) => {
    const initializerOptions = {
      ...threeInitializerOptions,
    };

    const {
      fixedUpdateRate = 1 / 50,
      onFixedUpdate,
      onUpdate: onThreeViewUpdate,
      onDispose: onThreeViewDispose,
      ...options
    } = initalizer(initializerOptions) ?? {};

    // Setup onFixedUpdate
    let fixedUpdateID: ReturnType<typeof setTimeout> | undefined;
    if (onFixedUpdate && fixedUpdateRate) {
      let lastUpdateTime = performance.now();
      let accumulatedUpdateTime = 0;
      const updateRate = fixedUpdateRate * 1000;

      const fixedUpdateHandler = (): void => {
        const now = performance.now();
        const updateTime = now - lastUpdateTime;
        lastUpdateTime = now;

        accumulatedUpdateTime += updateTime;

        while (accumulatedUpdateTime >= updateRate) {
          // We want to await each update before passing to the next
          onFixedUpdate(fixedUpdateRate);

          accumulatedUpdateTime -= updateRate;
        }

        if (fixedUpdateID !== undefined) clearTimeout(fixedUpdateID);
        fixedUpdateID = setTimeout(fixedUpdateHandler, fixedUpdateRate);
      };

      fixedUpdateID = setTimeout(fixedUpdateHandler, fixedUpdateRate);
    }

    // Update input after renders
    const onUpdate = (frametime: number): void => {
      onThreeViewUpdate?.(frametime);
    };

    const onDispose = (): void => {
      onThreeViewDispose?.();

      if (fixedUpdateID !== undefined) {
        clearTimeout(fixedUpdateID);
      }
    };

    return { onUpdate, onDispose, ...options };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
