import GameWorld from "./game-world";
import GameComponent from "./game-component";

class Position extends GameComponent {
  public x = 0;
  public y = 0;
}

describe("Entity Query", () => {
  it("correctly checks for entities", () => {
    // Given a Position query
    // When I create a new entity with a Position component
    // Then the query should contain that entity

    const world = new GameWorld();
    const system = world.watch([Position], (query) => query);

    const query = system();
    expect(query.size).toBe(0);

    const entity = world.spawn().insert(Position);
    expect(query.size).toBe(1);
    expect(query.has(entity)).toBe(true);
  });
});
