import { useEffect, useMemo } from "react";
import InputManager, { InputAction } from "../../utils/input-manager";
import type {
  ThreeViewInitalizerOptions,
  ThreeViewOptions,
} from "../use-three-view";
import useThreeView from "../use-three-view";

// Temporary until we have settings
const KEYBOARD_MAP = {
  menu: {
    KeyW: InputAction.Up,
    ArrowUp: InputAction.Up,
    KeyD: InputAction.Right,
    ArrowRight: InputAction.Right,
    KeyS: InputAction.Down,
    ArrowDown: InputAction.Down,
    KeyA: InputAction.Left,
    ArrowLeft: InputAction.Left,
    KeyF: InputAction.Interact,
    Tab: InputAction.Cancel,
  },
} as const;

export type GameViewOptions = ThreeViewOptions & {
  /**
   * The framerate of the fixed update in seconds, defaults to 1/50.
   */
  fixedUpdateRate?: number;

  /**
   * Called every fixed amount of time, disregarding the framerate.
   */
  onFixedUpdate?: (frametime: number) => void;

  /**
   * Input context to use. Defaults to "menu".
   */
  inputContext?: keyof typeof KEYBOARD_MAP;
};

export type GameViewInitializerOptions = ThreeViewInitalizerOptions & {
  /**
   * Input manager
   */
  input: InputManager;
};

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
  const input = useMemo(() => new InputManager(), []);

  useEffect(() => {
    input.bind();

    return () => {
      input.dispose();
    };
  }, [input]);

  return useThreeView((threeInitializerOptions) => {
    const initializerOptions = {
      ...threeInitializerOptions,
      input,
    };

    const {
      fixedUpdateRate = 1 / 50,
      inputContext = "menu",
      onFixedUpdate,
      onUpdate: onThreeViewUpdate,
      onDispose: onThreeViewDispose,
      ...options
    } = initalizer(initializerOptions) ?? {};

    // Setup input context
    input.setKeymap(KEYBOARD_MAP[inputContext]);

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

      // Update input
      input.update();
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
