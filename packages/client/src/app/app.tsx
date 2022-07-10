import { BoxGeometry, MeshBasicMaterial } from "three";
import coreInit, { makeGreeting } from "@qendil/core";
import EcsManager from "../utils/ecs";
import classNames from "classnames";

import type { ReactElement } from "react";

import useServiceWorker from "../hooks/use-service-worker";
import useGameView from "../hooks/use-game-view";
import useWasm from "../hooks/use-wasm";
import useOnscreenJoystick from "../hooks/use-onscreen-joystick";

import classes from "./app.module.css";
import commonClasses from "../style/common.module.css";

import {
  Mesh,
  MeshPositionSystem,
  MeshSmoothPositionSystem,
} from "../game/mesh";
import { Position } from "../game/position";
import { VelocitySystem, Velocity } from "../game/velocity";
import {
  ThirdPersonController,
  ThirdPersonControlSystem,
} from "../game/third-person-controller";
import {
  SmoothPosition,
  SmoothPositionAnimate,
  SmoothPositionInit,
  SmoothPositionUpdate,
} from "../game/smooth-position";

const gameWorld = new EcsManager();
const updateMeshPosition = gameWorld.watch(MeshPositionSystem);
const updateMeshSmoothPosition = gameWorld.watch(MeshSmoothPositionSystem);
const updatePosition = gameWorld.watch(VelocitySystem);
const updateStickControl = gameWorld.watch(ThirdPersonControlSystem);
const smoothPositionInit = gameWorld.watch(SmoothPositionInit);
const smoothPositionUpdate = gameWorld.watch(SmoothPositionUpdate);
const smoothPositionAnimate = gameWorld.watch(SmoothPositionAnimate);

const handleGreeting = (): void => {
  // eslint-disable-next-line no-alert
  alert(makeGreeting("world"));
};

export default function App(): ReactElement {
  const updateServiceWorker = useServiceWorker();
  const updatePrompt = updateServiceWorker && (
    <div className={classes.updatePrompt}>
      A new update is available:{" "}
      <button type="button" onClick={updateServiceWorker}>
        Update and Reload
      </button>
    </div>
  );

  const [onScreenJoystick, showJoystick, bindInput] = useOnscreenJoystick();

  const WorldView = useGameView(
    ({ scene, input, makePerspectiveCamera }) => {
      const camera = makePerspectiveCamera();
      camera.position.z = 5;

      const geometry = new BoxGeometry();
      const material = new MeshBasicMaterial({ color: 0xffcc00 });

      bindInput(input);

      const cube = gameWorld
        .spawn()
        .insertNew(Mesh, geometry, material)
        .insert(Position)
        .insert(SmoothPosition)
        .insert(Velocity, { factor: 3 })
        .insert(ThirdPersonController);

      const { mesh } = cube.get(Mesh);
      scene.add(mesh);

      return {
        camera,
        fixedUpdateRate: 1 / 20,
        onSetup(renderer): void {
          renderer.setClearColor(0x8a326c);
        },
        onUpdate(frametime): void {
          smoothPositionInit();
          smoothPositionUpdate();
          smoothPositionAnimate(frametime, 1 / 20);
          updateStickControl(input);
          updateMeshPosition();
          updateMeshSmoothPosition();
        },
        onFixedUpdate(frametime): void {
          updatePosition(frametime);
        },
        onDispose(): void {
          material.dispose();
          geometry.dispose();
          cube.dispose();
        },
      };
    },
    [bindInput]
  );

  const worldView = (
    <WorldView
      antialias
      className={classes.worldView}
      powerPreference="high-performance"
    />
  );

  useWasm(coreInit);
  const wasmTest = (
    <div>
      <button type="button" onClick={handleGreeting}>
        Test
      </button>
    </div>
  );

  return (
    <div className={classes.app}>
      {worldView}
      <div
        className={classNames(classes.uiContent, commonClasses.safeArea)}
        onPointerDown={showJoystick}
      >
        {updatePrompt}
        {wasmTest}
      </div>
      {onScreenJoystick}
    </div>
  );
}
