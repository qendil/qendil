import { BoxGeometry, Mesh, MeshBasicMaterial } from "three";
import { InputAxis } from "../utils/input-manager/input-manager";

import type { ReactElement } from "react";

import useServiceWorker from "../hooks/use-service-worker";

import classes from "./app.module.css";
import useGameView from "../hooks/use-game-view";

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

  return (
    <div className={classes.app}>
      {updatePrompt}
      {world}
    </div>
  );
}
