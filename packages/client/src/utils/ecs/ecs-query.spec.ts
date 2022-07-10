import EcsManager from "./ecs-manager";
import EcsComponent from "./ecs-component";

class Position extends EcsComponent {
  public x = 0;
  public y = 0;
}

class Velocity extends EcsComponent {
  public x = 0;
  public y = 0;
}

describe("EcsQuery", () => {
  it("correctly checks for entities", () => {
    // Given a Position query
    // When I create a new entity with a Position component
    // Then the query should contain that entity

    const world = new EcsManager();
    const system = world.watch(({ entities }) => entities, [Position]);

    const query = system();
    expect(query.size).toBe(0);

    const entity = world.spawn().add(Position);
    expect(query.size).toBe(1);
    expect(query.has(entity)).toBe(true);
  });

  it("iterates over components", () => {
    // Given a Position, Velocity-present query
    // And an entity that satisfies the query
    // When I iterate over the query
    // Then I should get the position component directly

    const world = new EcsManager();
    const system = world.watch(
      ({ entities }) => entities,
      [Position, Velocity.present()]
    );
    const query = system();

    world.spawn().add(Position, { x: 12, y: 144 }).add(Velocity);

    const queryList = [...query];
    expect(queryList).toEqual([[{ x: 12, y: 144 }]]);
  });

  it("iterates over entities", () => {
    // Given a Position, Velocity-present query
    // And an entity that satisfies the query
    // When I iterate over the query.asEntities()
    // Then I should get the entities

    const world = new EcsManager();
    const system = world.watch(
      ({ entities }) => entities,
      [Position, Velocity.present()]
    );
    const query = system();

    const entity = world.spawn().add(Position).add(Velocity);

    const queryList = [...query.asEntities()];
    expect(queryList).toEqual([entity]);
  });

  it("iterates over entities and components", () => {
    // Given a Position, Velocity-present query
    // And an entity that satisfies the query
    // When I iterate over the query.withEntities()
    // Then I should get the entities + their components

    const world = new EcsManager();
    const system = world.watch(
      ({ entities }) => entities,
      [Position, Velocity.present()]
    );
    const query = system();

    const entity = world.spawn().add(Position, { x: 12, y: 144 }).add(Velocity);

    const queryList = [...query.withEntities()];
    expect(queryList).toEqual([[entity, { x: 12, y: 144 }]]);
  });
});
