import type { ComponentProps, ComponentType, FunctionComponent } from "react";
import type { Camera, WebGLRenderer } from "three";

import {
  useCallback,
  forwardRef,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
} from "react";
import { PerspectiveCamera, Scene } from "three";
import { ResizeObserver } from "@juggle/resize-observer";
import classnames from "classnames";
import classes from "./use-three-view.module.css";
import getRenderProxy from "./render-proxy";

export type ThreeViewOptions = {
  /**
   * The camera that's going to be used to render the scene.
   */
  camera?: Camera;

  /**
   * Function to be called when the ThreeView is disposed.
   */
  onDispose?: () => void;

  /**
   * Function to be called whenever the ThreeView is resized.
   */
  onResize?: (width: number, height: number) => false | undefined;

  /**
   * Function to be called whenever the renderer has to setup
   */
  onSetup?: (renderer: WebGLRenderer) => void;

  /**
   * Function to be called each frame.
   */
  onUpdate?: (frametime: number) => void;
};

export type ThreeViewInitalizerOptions = {
  /**
   * A utility function to create a perspective camera with sane defaults.
   * Usually an aspect ratio that matches that of the ThreeView.
   */
  makePerspectiveCamera: (
    fov?: number,
    aspect?: number,
    near?: number,
    far?: number
  ) => PerspectiveCamera;

  /**
   * The main scene object that is going to be rendered.
   */
  scene: Scene;
};

export type ThreeViewInitalizer = (
  options: ThreeViewInitalizerOptions
) => ThreeViewOptions | undefined;

export type ThreeViewProps = ComponentProps<"div"> & {
  /**
   * Height of the container.
   */
  height?: number;

  /**
   * The function used to initialize the Three.js view
   */
  init: ThreeViewInitalizer;

  /**
   * The renderer pool to use for the Three.js view (0 to 6)
   * If 2 renderers have the same pool, they will share the same renderer.
   */
  pool?: number;

  /**
   * Width of the container.
   */
  width?: number;
};

/**
 * A component that renders a Three.js scene.
 */
const ThreeView = forwardRef<HTMLDivElement, ThreeViewProps>(
  ({ init, pool, className, width, height, style, ...props }, ref) => {
    const innerRef = useRef<HTMLDivElement>(null);

    // Forward the ref to the parent, if needed
    useImperativeHandle<HTMLDivElement | null, HTMLDivElement | null>(
      ref,
      () => innerRef.current
    );

    // Initialize the component
    useLayoutEffect(() => {
      const container = innerRef.current;
      if (!container) {
        throw new Error("Container not found");
      }

      // Utility function to create perspective maeras
      const makePerspectiveCamera = (
        fov = 75,
        aspect = container.clientWidth / container.clientHeight,
        near = 0.1,
        far = 1000
      ): PerspectiveCamera => new PerspectiveCamera(fov, aspect, near, far);

      const scene = new Scene();
      let lastTimestamp = 0;
      let rafID: ReturnType<typeof requestAnimationFrame> | undefined;

      // Create the renderer

      const {
        camera = makePerspectiveCamera(),
        onUpdate,
        onResize,
        onDispose,
        onSetup: onRendererSetup,
      } = init({ scene, makePerspectiveCamera }) ?? {};

      const { proxy, dispose } = getRenderProxy(
        container,
        pool,
        onRendererSetup
      );

      // The main loop of this renderer
      const render = (timestamp: number): void => {
        // Schedule the rendering of the next frame
        if (rafID !== undefined) cancelAnimationFrame(rafID);
        rafID = requestAnimationFrame(render);

        // Calculate the time passed since the last render
        const frametime = (timestamp - lastTimestamp) / 1000;
        lastTimestamp = timestamp;

        // Update and render
        onUpdate?.(frametime);
        proxy.render(scene, camera);
      };

      // The resize function
      const resize = (targetWidth: number, targetHeight: number): void => {
        // Make sure the new sizes are not zero
        targetWidth = Math.max(1, targetWidth);
        targetHeight = Math.max(1, targetHeight);

        // The onResize handler can return false to prevent the default behavior
        const updateCamera = onResize?.(targetWidth, targetHeight);

        if (updateCamera !== false) {
          proxy.resize(targetWidth, targetHeight);

          // TODO: Handle orthographic cameras too
          if (camera instanceof PerspectiveCamera) {
            camera.aspect = targetWidth / targetHeight;
            camera.updateProjectionMatrix();
          }
        }

        render(lastTimestamp);
      };

      // Setup a resize observer that resizes the renderer's canvas
      // whenever its parent element changes size
      const sizeObserver = new ResizeObserver((entries) => {
        for (const { contentRect } of entries) {
          resize(contentRect.width, contentRect.height);
        }
      });
      sizeObserver.observe(container);

      // Resizing the renderer to fit the container calls `render()`
      // Which also starts the main loop
      resize(container.clientWidth, container.clientHeight);

      // Cleanup
      return (): void => {
        // Stop the size observer
        sizeObserver.disconnect();

        // Stop the main loop when the component is unmounted
        if (rafID !== undefined) cancelAnimationFrame(rafID);

        // Dispose the renderer
        onDispose?.();
        dispose();
      };
    }, [init, pool]);

    return (
      <div
        className={classnames(classes.container, className)}
        // eslint-disable-next-line react/forbid-dom-props
        style={{ width, height, ...style }}
        {...props}
        ref={innerRef}
      />
    );
  }
);

/**
 * A "hook" to initialize a Three.js view.
 *
 * @param init - The function used to initialize the Three.js view
 * @param deps - Variables that cause the ThreeView to re-render when changed
 * @returns A Component to display the created scene
 */
export default function useThreeView(
  init: ThreeViewInitalizer,
  deps: unknown[]
): ComponentType<Omit<ThreeViewProps, "init">> {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const initCallback = useCallback(init, deps);

  return forwardRef<HTMLDivElement, Omit<ThreeViewProps, "init">>(
    (props, ref) => <ThreeView {...props} ref={ref} init={initCallback} />
  ) as FunctionComponent<Omit<ThreeViewProps, "init">>;
}
