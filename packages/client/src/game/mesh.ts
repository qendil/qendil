import { RigidBody } from "./rigid-body";
import { Mesh as ThreeMesh, Quaternion } from "three";
import { GameComponent, GameSystem } from "../utils/game-world";

/**
 * Tags entities that have a 3D mesh attached to them.
 */
export class Mesh extends GameComponent {
  public mesh: ThreeMesh;

  public constructor(...args: ConstructorParameters<typeof ThreeMesh>) {
    super();

    this.mesh = new ThreeMesh(...args);
  }
}

/**
 * Updates the mesh's position based on the entity's position.
 */
export const MeshPositionSystem = new GameSystem([Mesh, RigidBody], (query) => {
  for (const [{ mesh }, { body }] of query) {
    if (body === undefined) continue;

    {
      const { x, y, z } = body.translation();
      mesh.position.x = x;
      mesh.position.y = y;
      mesh.position.z = z;
    }

    {
      const { x, y, z, w } = body.rotation();
      mesh.setRotationFromQuaternion(new Quaternion(x, y, z, w));
    }
  }
});
