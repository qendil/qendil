import GameWorld from "../utils/game-world";
import { Mesh, MeshPositionSystem } from "./mesh";
import { Position } from "./position";

describe("MeshPositionSystem", () => {
  it("is updated whenever the position is updated", () => {
    // Given an entity with a mesh and a position
    // When I update the position
    // And then update the system
    // Then the mesh's position should be updated

    const world = new GameWorld();
    const entity = world.spawn().insert(Mesh).insert(Position);
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
});
