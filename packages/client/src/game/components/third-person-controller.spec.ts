import { EcsManager } from "../../utils/ecs";
import { InputAxis } from "../../utils/input-manager";
import { Input } from "../resources/input";
import {
  ThirdPersonController,
  ThirdPersonControlSystem,
} from "./third-person-controller";
import { Velocity } from "./velocity";

describe("ThirdPersonControlSystem", () => {
  it("does nothing if the entity does not have needed components", () => {
    // Given an entity with a ThridPersonController component
    // When I call the system
    // Then I should not get an error

    const world = new EcsManager();
    world.resources.add(Input);

    const system = world.watch(ThirdPersonControlSystem);

    world.spawn().add(ThirdPersonController);

    expect(() => {
      system();
    }).not.toThrow();
  });

  it("updates entity's velocity based on input", () => {
    // Given an entity with a Velocity and a ThirdPersonController
    // And an input manager
    // When I call the system
    // Then the entity's velocity should be updated according to the input

    const world = new EcsManager();
    world.resources.add(Input);
    const { input } = world.resources.get(Input);

    const system = world.watch(ThirdPersonControlSystem);
    const entity = world
      .spawn()
      .add(ThirdPersonController)
      .add(Velocity, { factor: 1 });
    const velocity = entity.get(Velocity);

    system();

    expect(velocity).toEqual({ factor: 1, x: 0, y: -0, z: 0 });

    vi.spyOn(input, "getAxis").mockImplementation((axis: InputAxis) =>
      axis === InputAxis.LX ? 0.5 : -0.75
    );
    system();

    expect(velocity).toEqual(
      expect.objectContaining({ x: 0.5, y: 0.75, z: 0 })
    );
  });
});
