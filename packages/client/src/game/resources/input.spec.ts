import { EcsManager } from "../../utils/ecs";
import InputManager from "../../utils/input-manager";
import { Input, UpdateInputConfig } from "./input";

describe("UpdateInputConfig", () => {
  it("updats the input's keymap", () => {
    // Given an world with an input resource
    // And an UpdateInputConfig system
    // When I update the input resource's keymap
    // Then the input manager's keymap should be updated

    const world = new EcsManager();
    world.resources.add(Input);
    const input = world.resources.get(Input);
    const system = world.addSystem(UpdateInputConfig);

    // Initial call to the system to reset the changes watcher
    system();

    input.keymap = "world";

    const spySetKeymap = vi.spyOn(InputManager.prototype, "setKeymap");
    system();

    expect(spySetKeymap).toHaveBeenCalled();
  });
});
