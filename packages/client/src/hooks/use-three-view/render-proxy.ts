import type { Camera, Scene, WebGLRendererParameters } from "three";
import { WebGLRenderer } from "three";

import DefaultMap from "@qendil/client-common/default-map";

// eslint-disable-next-line camelcase
type WebGlLoseContext = WEBGL_lose_context;

// While most devices usually have a limit of 16 contexts at a time,
// Some only have 8. And we're excluding 1 JUST IN CASE it's being
// used by something else.
// And even then, it's not guaranteed that all these 7 contexts
// are available.
export const MAX_WEBGL_CONTEXT_COUNT = 7;

export type RendererSetupHandler = (renderer: WebGLRenderer) => void;

export type RendererControls = {
  dispose: () => void;
  proxy: RendererProxy;
  renderer: WebGLRenderer;
};

/**
 * A renderer proxy, used to seamlessly switch between two modes:
 *  - Exclusive mode: where the renderer is directly appended to the DOM.
 *  - Shared mode: where the proxy has its own canvas in the DOM,
 *      that is updated from a shared WebGL renderer on each render.
 */
class RendererProxy {
  private readonly renderer: WebGLRenderer;
  private readonly container: HTMLElement;
  private readonly extLoseContext?: WebGlLoseContext = undefined;
  private readonly onRendererSetup?: RendererSetupHandler = undefined;
  private canvas?: HTMLCanvasElement | null = undefined;

  public constructor(
    container: HTMLElement,
    renderer: WebGLRenderer,
    extensionLoseContext?: WebGlLoseContext,
    onRendererSetup?: RendererSetupHandler
  ) {
    this.container = container;
    this.renderer = renderer;
    this.extLoseContext = extensionLoseContext;
    this.onRendererSetup = onRendererSetup;
  }

  public render(scene: Scene, camera: Camera): void {
    const { renderer, extLoseContext, canvas } = this;
    const rendererContext = renderer.getContext();

    // Restore the context if it's lost
    if (rendererContext.isContextLost()) {
      extLoseContext?.restoreContext();
    }

    // If we're in the shared mode, prepare the parent canvas
    // to render onto the proxy's canvas.
    if (canvas) {
      const parentCanvas = renderer.domElement;
      const { width, height } = canvas;

      // Resize the parent canvas if it's smaller than the proxy's canvas
      let parentHeight = parentCanvas.height;
      if (parentCanvas.width < width || parentHeight < height) {
        parentHeight = Math.max(height, parentHeight);

        // Note: .setSize() also updates the viewport
        renderer.setSize(Math.max(width, parentCanvas.width), parentHeight);
      } else {
        // Update the rendering viewport.
        // Note: It must be aligned to the bottom
        renderer.setViewport(0, parentHeight - height, width, height);
      }

      this.onRendererSetup?.(renderer);
    }

    // Render the actual scene
    renderer.render(scene, camera);

    // Render the parent canvas to the canvas
    if (canvas) {
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Failed to get a 2D context");

      // Clear the proxy's canvas if the parent's background
      // is transparent
      if (renderer.getClearAlpha() !== 1) {
        context.clearRect(0, 0, canvas.width, canvas.height);
      }

      // Flush before rendering, since we're not using requestAnimationFrame
      rendererContext.flush();

      // Finally draw the image
      context.drawImage(renderer.domElement, 0, 0);
    }
  }

  public resize(width: number, height: number): void {
    if (this.canvas) {
      this.canvas.width = width;
      this.canvas.height = height;
    } else {
      this.renderer.setSize(width, height);
    }
  }

  public makeExclusive(): void {
    // If there's no canvas, we're already in exclusive mode
    if (this.canvas === null) return;

    // Remove the canvas from the container
    this.canvas?.remove();
    // eslint-disable-next-line unicorn/no-null
    this.canvas = null;

    const { renderer, container } = this;

    // Reset the viewport
    renderer.setViewport(0, 0, 1, 1);

    // Re-add the parent canvas to the container
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.append(renderer.domElement);

    // Setup the renderer
    this.onRendererSetup?.(renderer);
  }

  public makeShared(): void {
    if (this.canvas) return;

    const { renderer, container } = this;

    // Create the canvas
    const parentCanvas = renderer.domElement;
    const canvas = document.createElement("canvas");
    canvas.dataset.proxy = "true";
    canvas.width = parentCanvas.width;
    canvas.height = parentCanvas.height;
    this.canvas = canvas;

    // Render the current frame
    if (parentCanvas.width && parentCanvas.height) {
      renderer.getContext().flush();
      canvas.getContext("2d")?.drawImage(parentCanvas, 0, 0);
    }

    // Replace the canvas in the container
    container.append(canvas);
    renderer.domElement.remove();
  }

  public onContextRestored(): void {
    // If we're not in shared mode, we need to re-setup the renderer
    if (!this.canvas) {
      this.onRendererSetup?.(this.renderer);
    }
  }
}

/**
 * A pool of renderers that are sharable among proxies.
 * This is to stay within an arbitrary limit of WebGL contexts.
 */
class RendererPool {
  private readonly proxies = new Set<RendererProxy>();
  private renderer?: WebGLRenderer = undefined;
  private extLoseContext?: WebGlLoseContext = undefined;

  public use(
    container: HTMLElement,
    parameters: WebGLRendererParameters,
    onRendererSetup?: RendererSetupHandler
  ): RendererControls {
    const renderer = this.getRenderer(parameters);

    const proxy = new RendererProxy(
      container,
      renderer,
      this.extLoseContext,
      onRendererSetup
    );
    this.proxies.add(proxy);

    if (this.proxies.size === 1) {
      // We have one proxy, make sure to append it to the proxy list
      proxy.makeExclusive();
    } else {
      // We have multiple proxies, make them share the same renderer
      for (const p of this.proxies) {
        p.makeShared();
      }
    }

    // Function to dispose of the proxy
    const dispose = (): void => {
      this.proxies.delete(proxy);

      if (this.proxies.size <= 0) {
        // There's no proxy left, dispose of the renderer pool
        renderer.domElement.remove();

        // Cleanup
        this.disposeRenderer();
      } else if (this.proxies.size <= 1) {
        // There's only one proxy left, make the renderer exclusive to it
        for (const p of this.proxies) {
          p.makeExclusive();
        }
      }
    };

    return { renderer, proxy, dispose };
  }

  private getRenderer(parameters: WebGLRendererParameters): WebGLRenderer {
    // Make sure there's a set up renderer
    this.renderer ??= this.createRenderer(parameters);

    return this.renderer;
  }

  private createRenderer(parameters: WebGLRendererParameters): WebGLRenderer {
    const renderer = new WebGLRenderer(parameters);

    // This extension is actually guaranteed to be supported on webgl
    this.extLoseContext =
      renderer.getContext().getExtension("WEBGL_lose_context") ?? undefined;

    const { domElement } = renderer;

    domElement.addEventListener("webglcontextrestored", () => {
      // Little hack to force a re-paint
      // https://stackoverflow.com/a/3485654
      domElement.style.display = "inline-block";
      void domElement.offsetHeight;
      domElement.style.display = "";

      // Notify the proxies
      for (const proxy of this.proxies) {
        proxy.onContextRestored();
      }
    });

    return renderer;
  }

  private disposeRenderer(): void {
    // Lose context eagerly to free it up for others
    const { renderer, extLoseContext } = this;
    if (renderer !== undefined) {
      if (!renderer.getContext().isContextLost()) {
        extLoseContext?.loseContext();
      }

      renderer.dispose();
    }

    this.extLoseContext = undefined;
    this.renderer = undefined;
  }
}

const renderers = new DefaultMap(() => new RendererPool());

export default function getRenderProxy(
  container: HTMLElement,
  parameters: WebGLRendererParameters,
  pool = MAX_WEBGL_CONTEXT_COUNT - 1,
  onRendererSetup?: RendererSetupHandler
): RendererControls {
  pool = Math.min(Math.max(pool, 0), MAX_WEBGL_CONTEXT_COUNT - 1);

  return renderers.get(pool).use(container, parameters, onRendererSetup);
}
