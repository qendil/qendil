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
import {
  ThirdPersonController,
  ThirdPersonControlSystem,
} from "../game/third-person-controller";

import {
  init as rapierInit,
  ColliderDesc,
  RigidBodyDesc,
  World,
} from "@dimforge/rapier3d-compat";
import { RigidBody, RigidBodyCreatorSystem } from "../game/rigid-body";

const gameWorld = new GameWorld();
const updateMeshPosition = gameWorld.watch(MeshPositionSystem);
const updateStickControl = gameWorld.watch(ThirdPersonControlSystem);
const rigidBodyCreator = gameWorld.watch(RigidBodyCreatorSystem);

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
  useWasm(rapierInit);

  const WorldView = useGameView(
    ({ scene, input, makePerspectiveCamera }) => {
      const camera = makePerspectiveCamera();
      camera.position.y = 5;
      camera.lookAt(0, 0, 0);

      const physicsWorld = new World({ x: 0, y: -9.81, z: 0 });
      physicsWorld.timestep = 1 / 50;
      physicsWorld.maxVelocityIterations = 8;

      const geometry = new BoxGeometry();
      const material = new MeshBasicMaterial({ color: 0xffcc00 });
      const material2 = new MeshBasicMaterial({ color: 0x00ccff });

      bindInput(input);

      gameWorld
        .spawn()
        .insertNew(
          RigidBody,
          RigidBodyDesc.fixed(),
          ColliderDesc.cuboid(10, 0.1, 10)
        );

      const cube = gameWorld
        .spawn()
        .insertNew(Mesh, geometry, material)
        .insertNew(
          RigidBody,
          RigidBodyDesc.dynamic().setTranslation(0, 1, 0).lockRotations(),
          ColliderDesc.cuboid(0.5, 0.5, 0.5)
        )
        .insert(ThirdPersonController);

      const cube2 = gameWorld
        .spawn()
        .insertNew(Mesh, geometry, material2)
        .insertNew(
          RigidBody,
          RigidBodyDesc.dynamic().setTranslation(0, 1, 2).setAdditionalMass(10),
          ColliderDesc.cuboid(0.5, 0.5, 0.5)
        );

      const { mesh } = cube.get(Mesh);
      const { mesh: mesh2 } = cube2.get(Mesh);
      scene.add(mesh);
      scene.add(mesh2);

      return {
        camera,
        fixedUpdateRate: 1 / 50,
        onSetup(renderer): void {
          renderer.setClearColor(0x8a326c);
        },
        onUpdate(): void {
          updateStickControl(input);
          updateMeshPosition();
        },
        onFixedUpdate(): void {
          rigidBodyCreator(physicsWorld);
          physicsWorld.step();
        },
        onDispose(): void {
          material.dispose();
          material2.dispose();
          geometry.dispose();
          cube.dispose();
          cube2.dispose();
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
