import useGameView from "./use-game-view";
import InputManager from "../../utils/input-manager";
import { render, renderHook } from "@testing-library/react";

describe("useGameView hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();

    // Mock the webgl context with some dummy methods
    class WebGL2RenderingContextDummy {
      public getExtension(): unknown {
        return undefined;
      }

      public isContextLost(): boolean {
        return false;
      }
    }
    vi.stubGlobal(
      "WebGL2RenderingContext",
      _mockClass(WebGL2RenderingContextDummy)
    );
  });

  it("updates input manager every frame", async () => {
    // Given a GameView with an input manager
    // When I wait for a frame to render
    // Then the input manager should be updated once

    const mockInputManagerUpdate = vi.spyOn(InputManager.prototype, "update");
    const { result } = renderHook(() => useGameView(() => ({}), []));
    const { current: GameView } = result;

    render(<GameView />);

    mockInputManagerUpdate.mockClear();
    await new Promise((resolve) => {
      requestAnimationFrame(resolve);
    });

    expect(mockInputManagerUpdate).toHaveBeenCalledOnce();
  });

  it("calls fixedUpdate twice when framerate is double the update rate", async () => {
    // Given a GameView with a fixed update rate of 1000/120
    // When I wait for a frame to render (at 1/60 framerate)
    // Then the fixedUpdate should be called twice

    const onFixedUpdate = vi.fn();
    const { result } = renderHook(() =>
      // Set fixedUpdate to just a little above 1/180, and less than 1/120
      // to guarantee it not reaching the 3rd call, but also
      // give some room to the 2nd call.
      useGameView(() => ({ onFixedUpdate, fixedUpdateRate: 1 / 170 }), [])
    );
    const { current: GameView } = result;

    render(<GameView />);
    // Skip the first frame
    await new Promise((resolve) => {
      requestAnimationFrame(resolve);
    });

    onFixedUpdate.mockClear();
    await new Promise((resolve) => {
      requestAnimationFrame(resolve);
    });

    expect(onFixedUpdate).toHaveBeenCalledTimes(2);
  });

  it("calls fixedUpdate half the time when framerate is half the update rate", async () => {
    // Given a GameView with a fixed update rate of 1000/30
    // When I wait for two frame to render (at 1/60 framerate)
    // Then the fixedUpdate should be called twice

    const onFixedUpdate = vi.fn();
    const { result } = renderHook(() =>
      // Set fixedUpdate to just a little below 1/30, and more than 1/60
      // to guarantee it not reaching the 2nd call, but also
      // give some room to the 1st call.
      useGameView(() => ({ onFixedUpdate, fixedUpdateRate: 1 / 50 }), [])
    );
    const { current: GameView } = result;

    render(<GameView />);
    // Skip the first frame
    await new Promise((resolve) => {
      requestAnimationFrame(resolve);
    });

    onFixedUpdate.mockClear();
    await new Promise((resolve) => {
      requestAnimationFrame(resolve);
    });
    await new Promise((resolve) => {
      requestAnimationFrame(resolve);
    });

    expect(onFixedUpdate).toHaveBeenCalledOnce();
  });
});
