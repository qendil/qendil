import { Mesh as ThreeMesh } from "three";
import { GameComponent, GameSystem } from "../utils/game-world";
import { Position } from "./position";
import { SmoothPosition } from "./smooth-position";

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
export const MeshPositionSystem = new GameSystem(
  [Mesh, Position, Position.changed(), SmoothPosition.absent()],
  (query) => {
    for (const [{ mesh }, { x, y, z }] of query) {
      mesh.position.x = x;
      mesh.position.y = y;
      mesh.position.z = z;
    }
  }
);

/**
 * Updates the mesh's position based on the entity's smooth physic's position.
 */
export const MeshSmoothPositionSystem = new GameSystem(
  [Mesh, SmoothPosition, SmoothPosition.changed()],
  (query) => {
    for (const [{ mesh }, { x, y, z }] of query) {
      mesh.position.x = x;
      mesh.position.y = y;
      mesh.position.z = z;
    }
  }
);
