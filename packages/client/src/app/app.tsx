import { BoxGeometry, Mesh as ThreeMesh, MeshBasicMaterial } from "three";
import { InputAxis } from "../utils/input-manager";
import coreInit, { makeGreeting } from "@qendil/core";
import GameWorld, { GameComponent } from "../utils/game-world";
import classNames from "classnames";

import type InputManager from "../utils/input-manager";
import type { ReactElement } from "react";

import useServiceWorker from "../hooks/use-service-worker";
import useGameView from "../hooks/use-game-view";
import useWasm from "../hooks/use-wasm";
import useOnscreenJoystick from "../hooks/use-onscreen-joystick";

import classes from "./app.module.css";
import commonClasses from "../style/common.module.css";

const gameWorld = new GameWorld();

class Position extends GameComponent {
  public x = 0;
  public y = 0;
  public z = 0;
}

class Velocity extends GameComponent {
  public x = 0;
  public y = 0;
  public z = 0;
  public factor = 1;
}

class Mesh extends GameComponent {
  public mesh: ThreeMesh;

  public constructor(...args: ConstructorParameters<typeof ThreeMesh>) {
    super();

    this.mesh = new ThreeMesh(...args);
  }
}

class ThirdPersonController extends GameComponent {
  // Nothing here
}

const updatePosition = gameWorld.watch(
  [Position, Velocity],
  (query, dt: number) => {
    for (const entity of query) {
      const { x, y, z } = entity.get(Velocity);
      const position = entity.get(Position);

      position.x += x * dt;
      position.y += y * dt;
      position.z += z * dt;
    }
  }
);

const updateMeshPosition = gameWorld.watch(
  [Mesh, Position.changed()],
  (query) => {
    for (const entity of query) {
      const { x, y, z } = entity.get(Position);
      const { mesh } = entity.get(Mesh);

      mesh.position.x = x;
      mesh.position.y = y;
      mesh.position.z = z;
    }
  }
);

const updateStickControl = gameWorld.watch(
  [ThirdPersonController, Velocity],
  (query, input: InputManager) => {
    const lx = input.getAxis(InputAxis.LX);
    const ly = input.getAxis(InputAxis.LY);

    for (const entity of query) {
      const velocity = entity.get(Velocity);
      const { factor: speed } = velocity;

      velocity.x = lx * speed;
      velocity.y = -ly * speed;
    }
  }
);

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
        onTouchStart={showJoystick}
      >
        {updatePrompt}
        {wasmTest}
      </div>
      {onScreenJoystick}
    </div>
  );
}
