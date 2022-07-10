import { Mesh as ThreeMesh } from "three";
import { EcsComponent, EcsSystem } from "../utils/ecs";
import { Position } from "./position";
import { SmoothPosition } from "./smooth-position";

/**
 * Tags entities that have a 3D mesh attached to them.
 */
export class Mesh extends EcsComponent {
  public mesh: ThreeMesh;

  public constructor(...args: ConstructorParameters<typeof ThreeMesh>) {
    super();

    this.mesh = new ThreeMesh(...args);
  }
}

/**
 * Updates the mesh's position based on the entity's position.
 */
export const MeshPositionSystem = new EcsSystem(
  ({ entities }) => {
    for (const [{ mesh }, { x, y, z }] of entities) {
      mesh.position.x = x;
      mesh.position.y = y;
      mesh.position.z = z;
    }
  },
  [Mesh, Position, Position.changed(), SmoothPosition.absent()]
);

/**
 * Updates the mesh's position based on the entity's smooth physic's position.
 */
export const MeshSmoothPositionSystem = new EcsSystem(
  ({ entities }) => {
    for (const [{ mesh }, { x, y, z }] of entities) {
      mesh.position.x = x;
      mesh.position.y = y;
      mesh.position.z = z;
    }
  },
  [Mesh, SmoothPosition, SmoothPosition.changed()]
);
