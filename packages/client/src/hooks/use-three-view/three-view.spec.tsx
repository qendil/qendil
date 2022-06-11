import { render, renderHook } from "@testing-library/react";
import { WebGLRenderer } from "three";
import useThreeView from "./use-three-view";

type HTMLCanvasElementDummy = HTMLCanvasElement & {
  _context?: CanvasRenderingContext2D;
};

function CanvasGetPrototypeDummy(this: HTMLCanvasElementDummy): unknown {
  this._context ??= new CanvasRenderingContext2D();

  return this._context;
}

describe("useThreeView hook", () => {
  vi.mock("three", async () => {
    const threeModule = await import("three");

    class WebGLRendererDummy {
      public domElement: HTMLCanvasElement;
      private readonly context = new WebGL2RenderingContext();

      public constructor() {
        this.domElement = document.createElement("canvas");
        this.domElement.dataset._source = "renderer";
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

  const mockRestoreContext = vi.fn();

  beforeEach(() => {
    vi.useRealTimers();
    vi.resetModules();
    vi.clearAllMocks();
    vi.restoreAllMocks();

    // Mock canvas.getContext to return a dummy context object
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      CanvasGetPrototypeDummy as any
    );

    // Mock the canvas 2d context with some dummy methods
    class CanvasRenderingContext2DDummy {
      public drawImage(): void {
        // Nothing to do
      }

      public clearRect(): void {
        // Nothing to do
      }
    }
    vi.stubGlobal(
      "CanvasRenderingContext2D",
      _mockClass(CanvasRenderingContext2DDummy)
    );

    // Mock the webgl context with some dummy methods
    class WebGL2RenderingContextDummy {
      public getExtension(name: string): unknown {
        // Expose the `WEBGL_lose_context` extension
        if (name === "WEBGL_lose_context") {
          return { restoreContext: mockRestoreContext };
        }

        return undefined;
      }

      public isContextLost(): boolean {
        return false;
      }

      public flush(): void {
        // Nothing to do
      }
    }
    vi.stubGlobal(
      "WebGL2RenderingContext",
      _mockClass(WebGL2RenderingContextDummy)
    );
  });

  it("creates two separate WebGLRenderer instances when Components use different pools", () => {
    // Given nothing
    // When I mount 2 ThreeView components in different pools
    // Then WebGLRenderer should be instanciated once for each component

    const { result } = renderHook(() =>
      useThreeView(({ makePerspectiveCamera }) => {
        const camera = makePerspectiveCamera();
        return { camera };
      }, [])
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

  it("creates a single WebGLRenderer when multiple Components use the same pool", () => {
    // Given nothing
    // When I mount 2 ThreeView components in the same pool
    // Then WebGLRenderer should be instanciated once

    const { result } = renderHook(() =>
      useThreeView(({ makePerspectiveCamera }) => {
        const camera = makePerspectiveCamera();
        return { camera };
      }, [])
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

  it("creates no more than 7 WebGLRenderer instances ever", async () => {
    // Given nothing
    // When I mount 100 ThreeView components, each in a different pool
    // Then I should only have 7 WebGLRenderer instances ever

    const { MAX_WEBGL_CONTEXT_COUNT } = await import("./render-proxy");

    const { result } = renderHook(() =>
      useThreeView(({ makePerspectiveCamera }) => {
        const camera = makePerspectiveCamera();
        return { camera };
      }, [])
    );
    const { current: ThreeView } = result;

    const THREE_VIEW_INSTANCE_COUNT = 100;

    render(
      <>
        {Array.from({ length: THREE_VIEW_INSTANCE_COUNT })
          .fill(0)
          .map((_, index) => (
            // eslint-disable-next-line react/no-array-index-key
            <ThreeView key={index} pool={index % MAX_WEBGL_CONTEXT_COUNT} />
          ))}
      </>
    );

    expect(WebGLRenderer).toHaveBeenCalledTimes(MAX_WEBGL_CONTEXT_COUNT);
  });

  it("calls onSetup on first mount when the renderer is exclusive", async () => {
    // Given an onSetup callback
    // When I mount an exclusive ThreeView component (alone in a pool)
    // And I wait for a frame to render
    // Then onSetup should be called once

    const onSetup = vi.fn();
    const { result } = renderHook(() =>
      useThreeView(({ makePerspectiveCamera }) => {
        const camera = makePerspectiveCamera();
        return { camera, onSetup };
      }, [])
    );
    const { current: ThreeView } = result;

    render(<ThreeView pool={0} />);
    await new Promise(process.nextTick);

    expect(onSetup).toHaveBeenCalledOnce();
  });

  it("calls onSetup on each render when the renderer is shared", async () => {
    // Given an onSetup callback
    // When I mount shared ThreeView component (multiple in the same pool)
    // And I wait for a frame to render
    // Then onSetup should be called once for each component

    const onSetup = vi.fn();
    const { result } = renderHook(() =>
      useThreeView(({ makePerspectiveCamera }) => {
        const camera = makePerspectiveCamera();
        return { camera, onSetup };
      }, [])
    );
    const { current: ThreeView } = result;

    render(
      <>
        <ThreeView pool={2} />
        <ThreeView pool={2} />
      </>
    );

    onSetup.mockClear();
    await new Promise((resolve) => {
      requestAnimationFrame(resolve);
    });

    expect(onSetup).toHaveBeenCalledTimes(2);
  });

  it("clears the canvas when rendering transparent backgrounds", async () => {
    // Given two ThreeView component with transparent backgrounds
    // When I wait for a frame to render
    // Then the canvas should be cleared once for each component

    const { result } = renderHook(() =>
      useThreeView(({ makePerspectiveCamera }) => {
        const camera = makePerspectiveCamera();
        return { camera };
      }, [])
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

  it("cleans up renderers when the last Component is unmounted, after a delay", () => {
    // Given a mounted ThreeView component
    // When I unmount the component
    // And wait a little bit
    // Then the component should be disposed

    const { result } = renderHook(() =>
      useThreeView(({ makePerspectiveCamera }) => {
        const camera = makePerspectiveCamera();
        return { camera };
      }, [])
    );
    const { current: ThreeView } = result;

    const { unmount } = render(<ThreeView />);
    vi.useFakeTimers();

    unmount();
    expect(WebGLRenderer.prototype.dispose).not.toHaveBeenCalled();

    vi.runAllTimers();
    expect(WebGLRenderer.prototype.dispose).toHaveBeenCalledOnce();
  });

  it("restores context after it has been lost", async () => {
    // Given a mounted ThreeView component
    // When the ThreeView's context is lost
    // Then it should attempt to restore the context

    const { result } = renderHook(() =>
      useThreeView(({ makePerspectiveCamera }) => {
        const camera = makePerspectiveCamera();
        return { camera };
      }, [])
    );
    const { current: ThreeView } = result;

    render(<ThreeView />);
    const mockIsContextLost = vi.mocked(
      WebGL2RenderingContext.prototype.isContextLost
    );
    mockIsContextLost.mockReturnValue(true);

    await new Promise((resolve) => {
      requestAnimationFrame(resolve);
    });

    expect(mockRestoreContext).toHaveBeenCalledOnce();
  });

  it("enlarges a shared renderer if it's too small", async () => {
    // Given 2 mounted ThreeView components of height 500
    // And their shared renderer is of height 100
    // When I wait for a frame to render
    // Then the shared renderer should be enlarged to height 500

    vi.spyOn(HTMLCanvasElement.prototype, "height", "get").mockImplementation(
      function (this: HTMLCanvasElement) {
        const { dataset }: { dataset: DOMStringMap } = this;

        return dataset._source === "renderer" ? 100 : 500;
      }
    );

    const { result } = renderHook(() =>
      useThreeView(({ makePerspectiveCamera }) => {
        const camera = makePerspectiveCamera();
        return { camera };
      }, [])
    );
    const { current: ThreeView } = result;

    render(
      <>
        <ThreeView pool={0} />
        <ThreeView pool={0} />
      </>
    );

    const mockedSetSize = vi.mocked(WebGLRenderer.prototype.setSize);
    mockedSetSize.mockClear();
    await new Promise((resolve) => {
      requestAnimationFrame(resolve);
    });

    expect(mockedSetSize).toHaveBeenCalledTimes(2);
    expect(mockedSetSize).toHaveBeenLastCalledWith(expect.anything(), 500);
  });

  it("forces re-render when the context is restored", () => {
    // Given a mounted ThreeView component that had lost its context
    // When its context is restored
    // Then It should force re-render
    // ... (by changing its css display and querying the resolved style)

    const { result } = renderHook(() =>
      useThreeView(({ makePerspectiveCamera }) => {
        const camera = makePerspectiveCamera();
        return { camera };
      }, [])
    );
    const { current: ThreeView } = result;

    render(<ThreeView pool={0} />);

    const mockSetDisplay = vi.spyOn(
      CSSStyleDeclaration.prototype,
      "display",
      "set"
    );
    const mockGetOffsetHeight = vi.spyOn(
      HTMLCanvasElement.prototype,
      "offsetHeight",
      "get"
    );

    // eslint-disable-next-line testing-library/no-node-access
    const canvas = document.querySelector("canvas");
    canvas?.dispatchEvent(new Event("webglcontextrestored"));

    expect(mockSetDisplay).toHaveBeenCalled();
    expect(mockGetOffsetHeight).toHaveBeenCalled();
  });
});