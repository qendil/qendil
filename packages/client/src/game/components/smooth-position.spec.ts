import { EcsManager } from "../../utils/ecs";
import { FrameInfo } from "../resources/frame-info";
import { GameConfig } from "../resources/game-config";
import { Position } from "./position";
import {
  SmoothPositionInit,
  SmoothPositionUpdate,
  SmoothPositionAnimate,
  SmoothPosition,
} from "./smooth-position";

describe("SmoothPositionInit system", () => {
  it("matches current position when the position component is added", () => {
    // Given an entity with a SmoothPosition component
    // When I add a position to the entity
    // Then the SmoothPosition's current position and origin
    // ... position should match that of the Position component

    const world = new EcsManager();
    const system = world.addSystem(SmoothPositionInit);

    const entity = world
      .spawn()
      .add(SmoothPosition)
      .add(Position, { x: 42, y: 12, z: 144 });

    system();

    expect(entity.get(SmoothPosition)).toEqual({
      x: 42,
      y: 12,
      z: 144,
      originalX: 42,
      originalY: 12,
      originalZ: 144,
      animationPercent: 0,
    });
  });
});

describe("SmoothPositionUpdate system", () => {
  it("resets the animation and updates the original position", () => {
    // Given an entity with Position and SmoothPosition components
    // When I channge the position
    // Then the smooth position component should be updated

    const world = new EcsManager();
    const system = world.addSystem(SmoothPositionUpdate);

    const entity = world
      .spawn()
      .add(SmoothPosition)
      .add(Position, { x: 42, y: 12, z: 144 });

    // Call system to ignore the first update
    system();

    // Change the values of the smooth position to see them get updated
    const smoothPositionComponent = entity.get(SmoothPosition);
    smoothPositionComponent.animationPercent = 0.5;
    smoothPositionComponent.x = 10;
    smoothPositionComponent.y = 10;
    smoothPositionComponent.z = 10;

    // Update the position and call the system
    const position = entity.get(Position);
    position.y = 142;

    system();

    expect(smoothPositionComponent).toEqual({
      x: 10,
      y: 10,
      z: 10,
      originalX: 10,
      originalY: 10,
      originalZ: 10,
      animationPercent: 0,
    });
  });
});

describe("SmoothPositionAnimate", () => {
  it("animates the position correctly", () => {
    // Given an entity with Position and SmoothPosition components
    // When I change the position
    // And I update such as that the render framerate is twice
    // ... that of the fixed update
    // Then the smooth position should be halfway through

    const world = new EcsManager();
    world.resources
      .add(GameConfig, { fixedUpdateRate: 1 / 30 })
      .add(FrameInfo, { frametime: 1 / 60 });

    const entity = world.spawn().add(SmoothPosition).add(Position);
    const update = world.addSystem(SmoothPositionUpdate);
    const animate = world.addSystem(SmoothPositionAnimate);

    const position = entity.get(Position);
    position.x = 10;
    position.y = 100;
    position.z = 1000;

    update();
    animate();

    const smooth = entity.get(SmoothPosition);

    expect(smooth.x).toBeCloseTo(5);
    expect(smooth.y).toBeCloseTo(50);
    expect(smooth.z).toBeCloseTo(500);
    expect(smooth.animationPercent).toBeCloseTo(0.5);
  });

  it("ignores entities that are already animated", () => {
    // Given 2 entities with Position and SmoothPosition components
    // When I change the position of one of them
    // Then only one of them will be animated

    const world = new EcsManager();
    world.resources
      .add(GameConfig, { fixedUpdateRate: 1 / 30 })
      .add(FrameInfo, { frametime: 1 / 60 });

    const entityA = world.spawn().add(SmoothPosition).add(Position);
    const entityB = world.spawn().add(SmoothPosition).add(Position);
    const update = world.addSystem(SmoothPositionUpdate);
    const animate = world.addSystem(SmoothPositionAnimate);

    update();
    animate();
    animate(); // Play 2 frames here to finish both animations

    const position = entityA.get(Position);
    position.x = 10;

    update();
    animate();

    const smoothA = entityA.get(SmoothPosition);
    const smoothB = entityB.get(SmoothPosition);

    expect(smoothA.animationPercent).toBeCloseTo(0.5);
    expect(smoothB.animationPercent).toBeCloseTo(1);
  });
});
