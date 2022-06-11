import type { ReactElement } from "react";
import { BoxGeometry, Mesh, MeshBasicMaterial } from "three";

import useServiceWorker from "../hooks/use-service-worker";
import useThreeView from "../hooks/use-three-view";

import classes from "./app.module.css";

export default function App(): ReactElement {
  const updateServiceWorker = useServiceWorker();
  const renderUpdatePrompt = (): ReactElement | undefined => {
    if (!updateServiceWorker) return;

    return (
      <div className={classes.updatePrompt}>
        A new update is available:{" "}
        <button type="button" onClick={updateServiceWorker}>
          click to update
        </button>
      </div>
    );
  };

  const WorldView = useThreeView(({ scene, makePerspectiveCamera }) => {
    const camera = makePerspectiveCamera();

    const geometry = new BoxGeometry();
    const material = new MeshBasicMaterial({ color: 0xffcc00 });
    const cube = new Mesh(geometry, material);
    scene.add(cube);

    camera.position.z = 5;

    return {
      camera,
      onUpdate(frametime): void {
        cube.rotation.z += frametime;
      },
    };
  }, []);

  const renderWorld = (): ReactElement => (
    <WorldView className={classes.world} />
  );

  return (
    <div className={classes.app}>
      {renderUpdatePrompt()}
      {renderWorld()}
    </div>
  );
}
