import { Mesh as ThreeMesh, Object3D } from "three";
import { EcsComponent, EcsSystem } from "@qendil/client-common/ecs";
import { Position } from "./position";
import { SmoothPosition } from "./smooth-position";
import { WorldScene } from "../resources/world-scene";

/**
 * Tags entities that have a 3D mesh attached to them.
 */
export class Mesh extends EcsComponent {
  public mesh: ThreeMesh;

  public constructor(...args: ConstructorParameters<typeof ThreeMesh>) {
    super();

    this.mesh = new ThreeMesh(...args);
  }

  public dispose(): void {
    const { parent } = this.mesh;

    if (parent instanceof Object3D) {
      parent.remove(this.mesh);
    }
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

/**
 * Attaches the mesh to the main 3d scene.
 */
export const MeshAttachToScene = new EcsSystem(
  ({ entities, resources: [{ scene }] }) => {
    for (const [{ mesh }] of entities) {
      scene.add(mesh);
    }
  },
  {
    entities: [Mesh, Mesh.changed()],
    resources: [WorldScene],
  }
);
