import EcsWorld from "./ecs-world";
import EcsComponent from "./ecs-component";
import EcsSystem from "./ecs-system";

class Position extends EcsComponent {
  public x = 0;
  public y = 0;
}

describe("GameWorld", () => {
  it("properly disposes of its queries", () => {
    // Given a world with queries
    // When I call .dispose() on the world
    // Then the queries should be disposed

    const world = new EcsWorld();
    world.watch([Position], (query) => query);

    /// @ts-expect-error 2341: We need to access the internal queries set
    const [query] = world.queries.get(Position);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const disposeSpy = vi.spyOn(query!, "dispose");

    world.dispose();
    expect(disposeSpy).toHaveBeenCalledOnce();
  });

  it("properly disposes of its queries once", () => {
    // Given a world with queries
    // When I call .dispose() on the world
    // And I call .dispose() on the world again
    // Then the queries should be disposed

    const world = new EcsWorld();
    world.watch([Position], (query) => query);

    /// @ts-expect-error 2341: We need to access the internal queries set
    const [query] = world.queries.get(Position);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const disposeSpy = vi.spyOn(query!, "dispose");

    world.dispose();
    world.dispose();
    expect(disposeSpy).toHaveBeenCalledOnce();
  });

  it("properly disposes of its entities", () => {
    // Given a world with entities
    // When I call .dispose() on the world
    // Then the entities should be disposed

    const world = new EcsWorld();
    const entity = world.spawn();

    const disposeSpy = vi.spyOn(entity, "dispose");

    world.dispose();
    expect(disposeSpy).toHaveBeenCalledOnce();
  });

  it("properly disposes of its entities once", () => {
    // Given a world with entities
    // When I call .dispose() on the world
    // And I call .dispose() on the world again
    // Then the entities should be disposed

    const world = new EcsWorld();
    const entity = world.spawn();

    const disposeSpy = vi.spyOn(entity, "dispose");

    world.dispose();
    world.dispose();
    expect(disposeSpy).toHaveBeenCalledOnce();
  });

  it("fails when attempting to spawn an entity after disposal", () => {
    // Given a disposed world
    // When I try to spawn an entity
    // Then I should get an error

    const world = new EcsWorld();
    world.dispose();

    expect(() => world.spawn()).toThrowError(
      "Cannot spawn an entity in a disposed world."
    );
  });

  it("fails when attempting to create a system after disposal", () => {
    // Given a disposed world
    // When I try to create a system
    // Then I should get an error

    const world = new EcsWorld();
    world.dispose();

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    expect(() => world.watch([], () => {})).toThrowError(
      "Cannot create a system in a disposed world."
    );
  });
});

describe("GameWorld system", () => {
  it("forwards arguments", () => {
    // Given a system that accepts 2 arguments
    // When I call the system with those 2 arguments
    // Then I the system's callback should receive those same 2 arguments as parameters

    const world = new EcsWorld();

    const system = world.watch(
      [Position],
      (_query, argument1: string, argument2: number) => {
        expect(argument1).toBe("hello");
        expect(argument2).toBe(42);
      }
    );

    system("hello", 42);
  });

  it("forwards callbacks' return values", () => {
    // Given a system with a callback that returns a value
    // When I call the system
    // Then I should receive the return value from the callback

    const world = new EcsWorld();
    const system = world.watch([Position], () => "test output");

    const returnValue = system();
    expect(returnValue).toBe("test output");
  });

  it("has auto-updated queries", () => {
    // Given an entity A with a Position component
    // And an entity B with no components
    // And a system that queries for Position-added components
    // When I run the system the first time
    // Then the entity A should be in the system's query
    // And the entity B should not be in the system's query
    // When I run the system the second time
    // Then neither entity  should be in the system's query
    // When I add a Position component to entity B
    // And I run the system the third time
    // Then only the entity B should be in the system's query

    const world = new EcsWorld();
    const system = world.watch([Position.added()], (query) => query);

    const query = system();
    const entityA = world.spawn().insert(Position);
    const entityB = world.spawn();
    expect([...query.asEntities()]).toContain(entityA);
    expect([...query.asEntities()]).not.toContain(entityB);

    system();
    expect([...query.asEntities()]).not.toContain(entityA);
    expect([...query.asEntities()]).not.toContain(entityB);

    system();
    entityB.insert(Position);
    expect([...query.asEntities()]).not.toContain(entityA);
    expect([...query.asEntities()]).toContain(entityB);
  });

  it("properly disposes of system queries", () => {
    // Given a system that queries for Position components
    // When I call `.dispose()` on the system
    // Then the corresponding query should no longer be tracked

    const world = new EcsWorld();
    /// @ts-expect-error 2341: We need to access the internal queries set
    const queries = world.queries.get(Position);

    const system = world.watch([Position], (query) => query);
    expect(queries.size).toBe(1);

    system.dispose();
    expect(queries.size).toBe(0);
  });

  it("properly disposes of system queries queries once", () => {
    // Given a system that queries for Position components
    // When I call `.dispose()` on the system
    // And I call `.dispose()` on the system again
    // Then the corresponding query should no longer be tracked

    const world = new EcsWorld();
    /// @ts-expect-error 2341: We need to access the internal queries set
    const queries = world.queries.get(Position);
    const system = world.watch([Position], (query) => query);

    const [query] = queries;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const disposeSpy = vi.spyOn(query!, "dispose");

    system.dispose();
    system.dispose();
    expect(disposeSpy).toHaveBeenCalledOnce();
  });

  it("accepts alternative syntax for systems", () => {
    // Given a GameSystem instance
    // When I call `.watch()` with the GameSystem instance
    // Then I should have a proper game system handle

    const mySystem = new EcsSystem([Position], (query) => [...query]);

    const world = new EcsWorld();
    const system = world.watch(mySystem);

    expect(system()).toBeInstanceOf(Array);
    expect(system()).toHaveLength(0);
  });
});
