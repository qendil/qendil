import GameWorld from "./game-world";
import GameComponent from "./game-component";

class Position extends GameComponent {
  public x = 0;
  public y = 0;
}

describe("Entity Query", () => {
  it("Disposes the parent query", () => {
    // Given a query builder
    // And a query
    // When I call .dispose() on the wrapper
    // Then the original query should be disposed

    const world = new GameWorld();
    const system = world.watch([Position], (query) => query);
    const query = system();

    /// @ts-expect-error 2341: We need to access the internal queries
    const queries = world.queries.get(Position);

    expect(queries.size).toBe(1);

    query.dispose();
    expect(queries.size).toBe(0);
  });

  it("correctly checks for entities", () => {
    // Given a Position query
    // When I create a new entity with a Position component
    // Then the query should contain that entity

    const world = new GameWorld();
    const system = world.watch([Position], (query) => query);
    const query = system();

    expect(query.size).toBe(0);

    const entity = world.spawn();
    entity.insert(Position);

    expect(query.size).toBe(1);
    expect(query.has(entity)).toBe(true);
  });
});
