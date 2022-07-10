import { EcsManager } from "../utils/ecs";
import { FrameInfoResource } from "./frame-info-resource";
import { GameConfigResource } from "./game-config-resource";
import { Mesh, MeshPositionSystem, MeshSmoothPositionSystem } from "./mesh";
import { Position } from "./position";
import {
  SmoothPosition,
  SmoothPositionAnimate,
  SmoothPositionUpdate,
} from "./smooth-position";

describe("MeshPositionSystem", () => {
  it("is updated whenever the position is updated", () => {
    // Given an entity with a mesh and a position
    // When I update the position
    // And then update the system
    // Then the mesh's position should be updated

    const world = new EcsManager();
    const entity = world.spawn().add(Mesh).add(Position);
    const system = world.watch(MeshPositionSystem);

    const position = entity.get(Position);
    const { mesh } = entity.get(Mesh);

    system();
    expect(mesh.position).toEqual(
      expect.objectContaining({ x: 0, y: 0, z: 0 })
    );

    position.x = 144;

    system();
    expect(mesh.position).toEqual(
      expect.objectContaining({ x: 144, y: 0, z: 0 })
    );
  });

  it("it ignores the position component when there's a SmoothPosition component", () => {
    // Given an entity with a mesh, a position and a smooth position
    // When I update the position
    // And then update the system
    // Then the mesh's position should be stay the same

    const world = new EcsManager();
    const entity = world.spawn().add(Mesh).add(Position).add(SmoothPosition);
    const system = world.watch(MeshPositionSystem);

    const position = entity.get(Position);
    const { mesh } = entity.get(Mesh);

    system();
    expect(mesh.position).toEqual(
      expect.objectContaining({ x: 0, y: 0, z: 0 })
    );

    position.x = 144;

    system();
    expect(mesh.position).toEqual(
      expect.objectContaining({ x: 0, y: 0, z: 0 })
    );
  });

  it("is updated whenever the smooth position is updated", () => {
    // Given an entity with a mesh, a position and a smooth position
    // When I update the position
    // And then update the systems
    // Then the mesh's position should be updated gradually

    const world = new EcsManager();
    world.resources
      .add(GameConfigResource, { fixedUpdateRate: 1 / 30 })
      .add(FrameInfoResource, { frametime: 1 / 60 });
    const entity = world.spawn().add(Mesh).add(Position).add(SmoothPosition);

    const meshPosition = world.watch(MeshSmoothPositionSystem);
    const positionUpdate = world.watch(SmoothPositionUpdate);
    const positionAnimate = world.watch(SmoothPositionAnimate);

    const position = entity.get(Position);
    const { mesh } = entity.get(Mesh);

    positionUpdate();
    positionAnimate();
    meshPosition();

    expect(mesh.position).toEqual(
      expect.objectContaining({ x: 0, y: 0, z: 0 })
    );

    position.x = 100;

    positionUpdate();
    positionAnimate();
    meshPosition();

    expect(mesh.position).toEqual(
      expect.objectContaining({ x: 50, y: 0, z: 0 })
    );
  });
});
