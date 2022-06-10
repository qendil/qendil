import { render, renderHook } from "@testing-library/react";
import { WebGLRenderer } from "three";
import useThreeView from "./use-three-view";

describe("useThreeView hook", () => {
  vi.mock("three", async () => {
    const threeModule = await import("three");

    class WebGLRendererDummy {
      public domElement: HTMLCanvasElement;
      private readonly context = new WebGL2RenderingContext();

      public constructor() {
        this.domElement = document.createElement("canvas");
      }

      public setSize(width: number, height: number): void {
        this.domElement.width = width;
        this.domElement.height = height;
      }

      public setViewport(): void {
        // Nothing to do
      }

      public render(): void {
        // Nothing to do
      }

      public getClearAlpha(): number {
        return 1;
      }

      public getContext(): unknown {
        return this.context;
      }

      public dispose(): void {
        // Nothing to do
      }
    }

    return {
      ...threeModule,
      WebGLRenderer: _mockClass(WebGLRendererDummy),
    };
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();

    vi.restoreAllMocks();

    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
      function () {
        // @ts-expect-error TS2683
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        this._context ??= new CanvasRenderingContext2D();

        // @ts-expect-error TS2683
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
        return this._context;
      }
    );

    vi.stubGlobal(
      "CanvasRenderingContext2D",
      _mockClass(
        class {
          public drawImage(): void {
            // Nothing to do
          }

          public clearRect(): void {
            // Nothing to do
          }
        }
      )
    );

    vi.stubGlobal(
      "WebGL2RenderingContext",
      _mockClass(
        class {
          public getExtension(): unknown {
            return undefined;
          }

          public isContextLost(): boolean {
            return false;
          }

          public flush(): void {
            // Nothing to do
          }
        }
      )
    );
  });

  it("creates two separate WebGLRenderer instances when Components use different slots", () => {
    const { result } = renderHook(() =>
      useThreeView(({ makePerspectiveCamera }) => {
        const camera = makePerspectiveCamera();
        return { camera };
      })
    );
    const { current: ThreeView } = result;

    render(
      <>
        <ThreeView pool={0} />
        <ThreeView pool={1} />
      </>
    );

    expect(WebGLRenderer).toHaveBeenCalledTimes(2);
  });

  it("creates a single WebGLRenderer when multiple Components use the same slot", () => {
    const { result } = renderHook(() =>
      useThreeView(({ makePerspectiveCamera }) => {
        const camera = makePerspectiveCamera();
        return { camera };
      })
    );
    const { current: ThreeView } = result;

    render(
      <>
        <ThreeView pool={2} />
        <ThreeView pool={2} />
      </>
    );

    expect(WebGLRenderer).toHaveBeenCalledOnce();
  });

  it("calls onRendererSetup on first mount", async () => {
    const onRendererSetup = vi.fn();

    const { result } = renderHook(() =>
      useThreeView(({ makePerspectiveCamera }) => {
        const camera = makePerspectiveCamera();
        return { camera, onRendererSetup };
      })
    );
    const { current: ThreeView } = result;

    render(<ThreeView pool={0} />);
    await new Promise(process.nextTick);

    expect(onRendererSetup).toHaveBeenCalledOnce();
  });

  it("calls onRenderSetup on each render when the renderer shared", async () => {
    const onRendererSetup = vi.fn();

    const { result } = renderHook(() =>
      useThreeView(({ makePerspectiveCamera }) => {
        const camera = makePerspectiveCamera();
        return { camera, onRendererSetup };
      })
    );
    const { current: ThreeView } = result;

    render(
      <>
        <ThreeView pool={2} />
        <ThreeView pool={2} />
      </>
    );

    onRendererSetup.mockClear();
    await new Promise((resolve) => {
      requestAnimationFrame(resolve);
    });

    expect(onRendererSetup).toHaveBeenCalledTimes(2);
  });

  it("clears the canvas when rendering transparent backgrounds", async () => {
    const { result } = renderHook(() =>
      useThreeView(({ makePerspectiveCamera }) => {
        const camera = makePerspectiveCamera();
        return { camera };
      })
    );
    const { current: ThreeView } = result;

    render(
      <>
        <ThreeView pool={2} />
        <ThreeView pool={2} />
      </>
    );

    vi.mocked(WebGLRenderer.prototype.getClearAlpha).mockReturnValue(0);
    const mockClearRect = vi.mocked(
      CanvasRenderingContext2D.prototype.clearRect
    );
    mockClearRect.mockClear();

    await new Promise((resolve) => {
      requestAnimationFrame(resolve);
    });

    expect(mockClearRect).toHaveBeenCalledTimes(2);
  });

  it("cleans up renderers after a delay", async () => {
    const { result } = renderHook(() =>
      useThreeView(({ makePerspectiveCamera }) => {
        const camera = makePerspectiveCamera();
        return { camera };
      })
    );
    const { current: ThreeView } = result;

    const { unmount } = render(<ThreeView pool={0} />);

    expect(WebGLRenderer.prototype.dispose).not.toHaveBeenCalled();

    vi.useFakeTimers();
    unmount();
    vi.runAllTimers();
    vi.useRealTimers();
    await new Promise(process.nextTick);

    expect(WebGLRenderer.prototype.dispose).toHaveBeenCalledOnce();
  });
});
