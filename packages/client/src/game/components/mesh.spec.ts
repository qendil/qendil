import { EcsManager } from "@qendil/client-common/ecs";
import { FrameInfo } from "../resources/frame-info";
import { GameConfig } from "../resources/game-config";
import { WorldScene } from "../resources/world-scene";
import {
  Mesh,
  MeshAttachToScene,
  MeshColor,
  MeshPositionSystem,
  MeshSmoothPositionSystem,
} from "./mesh";
import { Position } from "./position";
import {
  SmoothPosition,
  SmoothPositionAnimate,
  SmoothPositionUpdate,
} from "./smooth-position";

describe("Mesh component", () => {
  it("it detaches itself from the scene when disposed", () => {
    // Given a world with a WorldScene resource
    // And a MeshAttachToScene system
    // And an entity with a Mesh component in the world
    // When I dispose of the entity
    // Then the mesh should be detached from the scene

    const world = new EcsManager();
    world.resources.add(WorldScene);
    const system = world.addSystem(MeshAttachToScene);

    const entity = world.spawn().add(Mesh);

    system();

    const { scene } = world.resources.get(WorldScene);

    entity.dispose();
    expect(scene.children).toHaveLength(0);
  });

  it("correctly disposes of the geometry and material when disposed", () => {
    // Given an entity with a mesh component
    // When the entity is disposed
    // The entity's geometry and material should be disposed

    const world = new EcsManager();
    world.resources.add(WorldScene);
    const system = world.addSystem(MeshAttachToScene);

    const entity = world.spawn().add(Mesh);

    system();

    const { geometry, material } = entity.get(Mesh);
    const spyGeometryDispose = vi.spyOn(geometry, "dispose");
    const spyMaterialDispose = vi.spyOn(material, "dispose");

    entity.dispose();

    expect(spyGeometryDispose).toHaveBeenCalled();
    expect(spyMaterialDispose).toHaveBeenCalled();
  });
});

describe("MeshColor", () => {
  it("correctly updates the material's color", () => {
    // Given an entity with a mesh component
    // When I update the mesh's color
    // The mesh's material should be updated accordingly

    const world = new EcsManager();
    const entity = world.spawn().add(Mesh);
    const system = world.addSystem(MeshColor);

    const mesh = entity.get(Mesh);
    const { material } = mesh;

    expect(material.color.getHex()).toBe(0xffffff);

    mesh.color = 0xffcc00;
    system();

    expect(material.color.getHex()).toBe(0xffcc00);
  });
});

describe("MeshPositionSystem", () => {
  it("is updated whenever the position is updated", () => {
    // Given an entity with a mesh and a position
    // When I update the position
    // And then update the system
    // Then the mesh's position should be updated

    const world = new EcsManager();
    const entity = world.spawn().add(Mesh).add(Position);
    const system = world.addSystem(MeshPositionSystem);

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
    const system = world.addSystem(MeshPositionSystem);

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
      .add(GameConfig, { fixedUpdateRate: 1 / 30 })
      .add(FrameInfo, { frametime: 1 / 60 });
    const entity = world.spawn().add(Mesh).add(Position).add(SmoothPosition);

    const meshPosition = world.addSystem(MeshSmoothPositionSystem);
    const positionUpdate = world.addSystem(SmoothPositionUpdate);
    const positionAnimate = world.addSystem(SmoothPositionAnimate);

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

describe("MeshAttachToScene", () => {
  it("it attaches the mesh to the main scene on creation", () => {
    // Given a world with a WorldScene resource
    // And a MeshAttachToScene system
    // When I add an entity with a Mesh component
    // Then the mesh should be attached to the scene

    const world = new EcsManager();
    world.resources.add(WorldScene);
    const system = world.addSystem(MeshAttachToScene);

    const entity = world.spawn().add(Mesh);

    system();

    const { mesh } = entity.get(Mesh);
    const { scene } = world.resources.get(WorldScene);
    expect(mesh.parent).toBe(scene);
  });
});
