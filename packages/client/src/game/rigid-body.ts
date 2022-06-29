import type {
  RigidBodyDesc,
  RigidBody as PhysicsRigidBody,
  World,
  Collider,
  ColliderDesc,
} from "@dimforge/rapier3d-compat";
import { GameComponent, GameSystem } from "../utils/game-world";

export class RigidBody extends GameComponent {
  public bodyDescription: RigidBodyDesc;
  public colliderDescription: ColliderDesc;

  public body?: PhysicsRigidBody;
  public collider?: Collider;

  public constructor(body: RigidBodyDesc, collider: ColliderDesc) {
    super();

    this.bodyDescription = body;
    this.colliderDescription = collider;
  }
}

export const RigidBodyCreatorSystem = new GameSystem(
  [RigidBody, RigidBody.added()],
  (query, world: World) => {
    for (const [component] of query) {
      const { bodyDescription: description, colliderDescription } = component;

      const rigidBody = world.createRigidBody(description);
      component.body = rigidBody;
      component.collider = world.createCollider(colliderDescription, rigidBody);
    }
  }
);
