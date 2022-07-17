import {
  BoxGeometry,
  Mesh as ThreeMesh,
  MeshBasicMaterial,
  Object3D,
} from "three";
import { EcsComponent, EcsSystem } from "@qendil/client-common/ecs";
import { Position } from "./position";
import { SmoothPosition } from "./smooth-position";
import { WorldScene } from "../resources/world-scene";

/**
 * Tags entities that have a 3D mesh attached to them.
 */
export class Mesh extends EcsComponent {
  public material = new MeshBasicMaterial();
  public geometry = new BoxGeometry();
  public mesh = new ThreeMesh(this.geometry, this.material);

  public color = 0;

  public dispose(): void {
    const { parent } = this.mesh;

    if (parent instanceof Object3D) {
      parent.remove(this.mesh);
    }

    this.geometry.dispose();
    this.material.dispose();
  }
}

export const MeshColor = new EcsSystem(
  { entities: [Mesh, Mesh.changed()] },
  ({ entities }) => {
    for (const [{ material, color }] of entities) {
      material.color.setHex(color);
    }
  }
);

/**
 * Updates the mesh's position based on the entity's position.
 */
export const MeshPositionSystem = new EcsSystem(
  { entities: [Mesh, Position, Position.changed(), SmoothPosition.absent()] },
  ({ entities }) => {
    for (const [{ mesh }, { x, y, z }] of entities) {
      mesh.position.x = x;
      mesh.position.y = y;
      mesh.position.z = z;
    }
  }
);

/**
 * Updates the mesh's position based on the entity's smooth physic's position.
 */
export const MeshSmoothPositionSystem = new EcsSystem(
  { entities: [Mesh, SmoothPosition, SmoothPosition.changed()] },
  ({ entities }) => {
    for (const [{ mesh }, { x, y, z }] of entities) {
      mesh.position.x = x;
      mesh.position.y = y;
      mesh.position.z = z;
    }
  }
);

/**
 * Attaches the mesh to the main 3d scene.
 */
export const MeshAttachToScene = new EcsSystem(
  {
    entities: [Mesh, Mesh.changed()],
    resources: [WorldScene],
  },
  ({ entities, resources: [{ scene }] }) => {
    for (const [{ mesh }] of entities) {
      scene.add(mesh);
    }
  }
);
