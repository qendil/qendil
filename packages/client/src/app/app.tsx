import { BoxGeometry, Mesh, MeshBasicMaterial } from "three";
import { InputAxis } from "../utils/input-manager/input-manager";
import coreInit, { make_greeting as makeGreeting } from "@qendil/core";

import type { ReactElement } from "react";

import useServiceWorker from "../hooks/use-service-worker";
import useGameView from "../hooks/use-game-view";
import useWasm from "../hooks/use-wasm";

import classes from "./app.module.css";

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
        click to update
      </button>
    </div>
  );

  const WorldView = useGameView(({ scene, input, makePerspectiveCamera }) => {
    const camera = makePerspectiveCamera();

    const geometry = new BoxGeometry();
    const material = new MeshBasicMaterial({ color: 0xffcc00 });
    const cube = new Mesh(geometry, material);
    scene.add(cube);

    camera.position.z = 5;

    let velocityX = 0;
    let velocityY = 0;
    const moveSpeed = 3;

    return {
      camera,
      onUpdate(frametime): void {
        velocityX = input.getAxis(InputAxis.LX) * moveSpeed;
        velocityY = input.getAxis(InputAxis.LY) * moveSpeed;

        camera.position.x -= velocityX * frametime;
        camera.position.y += velocityY * frametime;
      },
    };
  }, []);

  const world = <WorldView className={classes.world} />;

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
      {updatePrompt}
      {wasmTest}
      {world}
    </div>
  );
}
