import EcsComponent from "./ecs-component";
import EcsManager from "./ecs-manager";
import EntityQueryBuilder from "./ecs-query-builder";
import EcsSystem from "./ecs-system";

describe("ECS System runner", () => {
  it("runs registered systems in insertion order", () => {
    // Given a system runner
    // And systems A, B and C
    // When I add A, B and C to the runner
    // And I run the runner
    // Then A, B and C are run in that order

    const callbackA = vi.fn();
    const SystemA = new EcsSystem(callbackA, {});
    const callbackB = vi.fn(() => {
      expect(callbackA).toHaveBeenCalledOnce();
    });
    const SystemB = new EcsSystem(callbackB, {});
    const callbackC = vi.fn(() => {
      expect(callbackB).toHaveBeenCalledOnce();
    });
    const SystemC = new EcsSystem(callbackC, {});

    const world = new EcsManager();
    const runner = world.addRunner().add(SystemA).add(SystemB).add(SystemC);

    runner();

    expect(callbackA).toHaveBeenCalledOnce();
  });

  it("disposes of registered systems", () => {
    // Given a system runner with a system A
    // When I dispose of the runner
    // Then the systems A should be disposed of

    class DummyComponent extends EcsComponent {}
    const SystemA = new EcsSystem(vi.fn(), [DummyComponent]);

    const world = new EcsManager();
    const runner = world.addRunner().add(SystemA);

    // There's nothing else to spy on,
    // so we just spy on when the EntityQueryBuilder is disposed
    const disposeSpy = vi.spyOn(EntityQueryBuilder.prototype, "dispose");
    runner.dispose();

    expect(disposeSpy).toHaveBeenCalledOnce();
  });
});
