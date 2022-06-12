import { useEffect, useMemo, useRef } from "react";
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
  // Stock this as a ref because we don't want it to reset on each re-render
  // But also because we don't want to cause a re-render on each update
  // And it's getting updated a lot...
  const cumulativeFrametime = useRef(0);

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
      onFixedUpdate,
      onUpdate: onRenderUpdate,
      inputContext = "menu",
      ...options
    } = initalizer(initializerOptions) ?? {};

    // Setup input context
    input.setKeymap(KEYBOARD_MAP[inputContext]);

    // Custom onUpdate that also does fixed updates
    const onUpdate = (frametime: number): void => {
      onRenderUpdate?.(frametime);

      // Run fixed update only if enough time passed since last update
      // And as many times as needed to catch up to the fixedUpdateRate
      if (onFixedUpdate && fixedUpdateRate) {
        cumulativeFrametime.current += frametime;
        while (cumulativeFrametime.current >= fixedUpdateRate) {
          onFixedUpdate(fixedUpdateRate);
          cumulativeFrametime.current -= fixedUpdateRate;
        }
      }

      // Update input
      input.update();
    };

    return { onUpdate, ...options };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
