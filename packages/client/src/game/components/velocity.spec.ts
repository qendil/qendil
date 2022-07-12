import { EcsManager } from "../../utils/ecs";
import { GameConfig } from "../resources/game-config";
import { Position } from "./position";
import { Velocity, VelocitySystem } from "./velocity";

describe("VelocitySystem", () => {
  it("updates position", () => {
    // Given an entity with a Velocity and a Position
    // When I trigger the system with dt=1
    // Then the position should be updated accordingly

    const world = new EcsManager();
    world.resources.add(GameConfig, { fixedUpdateRate: 1 });

    const system = world.addSystem(VelocitySystem);
    const entity = world
      .spawn()
      .add(Velocity, { x: 10, y: -100 })
      .add(Position, { x: 100, y: 500 });
    const position = entity.get(Position);

    system();

    expect(position).toEqual({ x: 110, y: 400, z: 0 });
  });
});
