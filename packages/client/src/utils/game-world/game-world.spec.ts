import GameWorld from "./game-world";
import GameComponent from "./game-component";

class Position extends GameComponent {
  public x = 0;
  public y = 0;
}

describe("GameWorld system", () => {
  it("forwards arguments", () => {
    // Given a system that accepts 2 arguments
    // When I call the system with those 2 arguments
    // Then I the system's callback should receive those same 2 arguments as parameters

    const world = new GameWorld();

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

    const world = new GameWorld();
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

    const world = new GameWorld();
    const system = world.watch([Position.added()], (query) => query);

    const query = system();
    const entityA = world.spawn().insert(Position);
    const entityB = world.spawn();
    expect([...query]).toContain(entityA);
    expect([...query]).not.toContain(entityB);

    system();
    expect([...query]).not.toContain(entityA);
    expect([...query]).not.toContain(entityB);

    system();
    entityB.insert(Position);
    expect([...query]).not.toContain(entityA);
    expect([...query]).toContain(entityB);
  });

  it("properly dispose their queries", () => {
    // Given a system that queries for Position components
    // When I call `.dispose()` on the system
    // Then the corresponding query should no longer be tracked

    const world = new GameWorld();
    /// @ts-expect-error 2341: We need to access the internal queries set
    const queries = world.queries.get(Position);

    const system = world.watch([Position], (query) => query);
    expect(queries.size).toBe(1);

    system.dispose();
    expect(queries.size).toBe(0);
  });
});
