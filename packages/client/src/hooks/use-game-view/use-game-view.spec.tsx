import useGameView from "./use-game-view";
import InputManager from "../../utils/input-manager";
import { render, renderHook } from "@testing-library/react";

describe("useGameView hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
    vi.useRealTimers();

    // Mock the webgl context with some dummy methods
    class WebGL2RenderingContext {
      public getExtension(): unknown {
        return undefined;
      }

      public isContextLost(): boolean {
        return false;
      }
    }
    vi.stubGlobal("WebGL2RenderingContext", _mockClass(WebGL2RenderingContext));
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

  it("calls fixedUpdate twice when framerate is double the update rate", () => {
    // Given a GameView with a fixed update rate of 1/120
    // When I wait for a frame to render (at 1/60 framerate)
    // Then the fixedUpdate should be called twice

    const onFixedUpdate = vi.fn();
    const { result } = renderHook(() =>
      // Set fixedUpdate to just a little above 1/180, and less than 1/120
      // to guarantee it not reaching the 3rd call, but also
      // give some room to the 2nd call.
      useGameView(() => ({ onFixedUpdate, fixedUpdateRate: 1 / 120 }), [])
    );
    const { current: GameView } = result;

    vi.useFakeTimers();
    const performanceNowMock = vi.spyOn(performance, "now");
    performanceNowMock.mockReturnValue(0);

    onFixedUpdate.mockClear();

    render(<GameView />);

    const frameRate = 1000 / 60;
    const frames = 1;
    performanceNowMock.mockReturnValue(frameRate * frames);
    vi.advanceTimersByTime(frameRate * frames);

    expect(onFixedUpdate).toHaveBeenCalledTimes(2);
  });

  it("calls fixedUpdate half the time when framerate is half the update rate", () => {
    // Given a GameView with a fixed update rate of 1/30
    // When I wait for two frame to render (at 1/60 framerate)
    // Then the fixedUpdate should be called twice

    const onFixedUpdate = vi.fn();
    const { result } = renderHook(() =>
      useGameView(() => ({ onFixedUpdate, fixedUpdateRate: 1 / 30 }), [])
    );
    const { current: GameView } = result;

    vi.useFakeTimers();
    const performanceNowMock = vi.spyOn(performance, "now");
    performanceNowMock.mockReturnValue(0);

    onFixedUpdate.mockClear();

    render(<GameView />);

    const frameRate = 1000 / 60;
    const frames = 2;
    performanceNowMock.mockReturnValue(frameRate * frames);
    vi.advanceTimersByTime(frameRate * frames);

    expect(onFixedUpdate).toHaveBeenCalledTimes(1);
  });

  test("result component does not call the initializer on re-render", () => {
    // Given a rendered GameView component
    // When the GameView component re-renders
    // Then it should not call the initializer again

    const initializer = vi.fn();
    const { result } = renderHook(() =>
      useGameView(() => {
        initializer();
        return {};
      }, [])
    );
    const { current: GameView } = result;

    const { rerender } = render(<GameView />);

    initializer.mockClear();
    rerender(<GameView />);

    expect(initializer).not.toHaveBeenCalled();
  });
});
