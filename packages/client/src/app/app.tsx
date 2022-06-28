import { BoxGeometry, MeshBasicMaterial } from "three";
import coreInit, { makeGreeting } from "@qendil/core";
import GameWorld from "../utils/game-world";
import classNames from "classnames";

import type { ReactElement } from "react";

import useServiceWorker from "../hooks/use-service-worker";
import useGameView from "../hooks/use-game-view";
import useWasm from "../hooks/use-wasm";
import useOnscreenJoystick from "../hooks/use-onscreen-joystick";

import classes from "./app.module.css";
import commonClasses from "../style/common.module.css";

import { Mesh, MeshPositionSystem } from "../game/mesh";
import { Position } from "../game/position";
import { VelocitySystem, Velocity } from "../game/velocity";
import {
  ThirdPersonController,
  ThirdPersonControlSystem,
} from "../game/third-person-controller";

const gameWorld = new GameWorld();
const updateMeshPosition = gameWorld.watch(MeshPositionSystem);
const updatePosition = gameWorld.watch(VelocitySystem);
const updateStickControl = gameWorld.watch(ThirdPersonControlSystem);

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
        .insert(Velocity, { factor: 3 })
        .insert(ThirdPersonController);

      const { mesh } = cube.get(Mesh);
      scene.add(mesh);

      return {
        camera,
        onSetup(renderer): void {
          renderer.setClearColor(0x8a326c);
        },
        onUpdate(frametime): void {
          updateStickControl(input);
          updatePosition(frametime);
          updateMeshPosition();
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
