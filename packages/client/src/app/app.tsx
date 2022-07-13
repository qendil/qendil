import { BoxGeometry, MeshBasicMaterial } from "three";
import coreInit, { makeGreeting } from "@qendil/core";
import { EcsManager } from "@qendil/client-common/ecs";
import classNames from "classnames";

import { useEffect } from "react";

import useServiceWorker from "../hooks/use-service-worker";
import useGameView from "../hooks/use-game-view";
import useWasm from "../hooks/use-wasm";
import useOnscreenJoystick from "../hooks/use-onscreen-joystick";

import classes from "./app.module.css";
import commonClasses from "../style/common.module.css";

import {
  Mesh,
  MeshAttachToScene,
  MeshPositionSystem,
  MeshSmoothPositionSystem,
} from "../game/components/mesh";
import { Position } from "../game/components/position";
import { VelocitySystem, Velocity } from "../game/components/velocity";
import {
  ThirdPersonController,
  ThirdPersonControlSystem,
} from "../game/components/third-person-controller";
import {
  SmoothPosition,
  SmoothPositionAnimate,
  SmoothPositionInit,
  SmoothPositionUpdate,
} from "../game/components/smooth-position";
import { Input, UpdateInputConfig } from "../game/resources/input";
import { FrameInfo } from "../game/resources/frame-info";
import { GameConfig } from "../game/resources/game-config";
import { WorldScene } from "../game/resources/world-scene";

import type { ReactElement } from "react";

const gameWorld = new EcsManager();

const gameUpdate = gameWorld
  .addRunner()
  .add(UpdateInputConfig)
  .add(MeshAttachToScene)
  .add(SmoothPositionInit)
  .add(SmoothPositionUpdate)
  .add(SmoothPositionAnimate)
  .add(ThirdPersonControlSystem)
  .add(MeshPositionSystem)
  .add(MeshSmoothPositionSystem);

const gameFixedUpdate = gameWorld.addRunner().add(VelocitySystem);

gameWorld.resources.add(Input).add(FrameInfo).add(GameConfig).add(WorldScene);

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

  useEffect(() => {
    const { input } = gameWorld.resources.get(Input);
    bindInput(input);
  }, [bindInput]);

  const WorldView = useGameView(({ scene, makePerspectiveCamera }) => {
    const camera = makePerspectiveCamera();
    camera.position.z = 5;

    const geometry = new BoxGeometry();
    const material = new MeshBasicMaterial({ color: 0xffcc00 });

    const cube = gameWorld
      .spawn()
      .addNew(Mesh, geometry, material)
      .add(Position)
      .add(SmoothPosition)
      .add(Velocity, { factor: 3 })
      .add(ThirdPersonController);

    const { input } = gameWorld.resources.get(Input);
    const frameInfo = gameWorld.resources.get(FrameInfo);
    const gameConfig = gameWorld.resources.get(GameConfig);
    const { scene: worldScene } = gameWorld.resources.get(WorldScene);

    scene.add(worldScene);

    return {
      camera,
      fixedUpdateRate: gameConfig.fixedUpdateRate,
      onSetup(renderer): void {
        renderer.setClearColor(0x8a326c);
      },
      onUpdate(frametime): void {
        frameInfo.frametime = frametime;

        gameUpdate();

        input.update();
      },
      onFixedUpdate(): void {
        gameFixedUpdate();
      },
      onDispose(): void {
        material.dispose();
        geometry.dispose();

        cube.dispose();
      },
    };
  }, []);

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
