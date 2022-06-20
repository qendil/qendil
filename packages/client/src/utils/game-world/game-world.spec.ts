import GameComponent from "./game-component";
import GameWorld from "./game-world";

class Position extends GameComponent {
  public x = 0;
  public y = 0;
}

describe("GameWorld", () => {
  test("systems forward arguments", () => {
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

  test("systems forward callbacks' return values", () => {
    // Given a system with a callback that returns a value
    // When I call the system
    // Then I should receive the return value from the callback

    const world = new GameWorld();

    const system = world.watch([Position], () => "test output");

    expect(system()).toBe("test output");
  });

  test("systems' queries auto-update", () => {
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

    system.dispose();
  });
});
