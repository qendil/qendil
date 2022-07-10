import EcsManager from "./ecs-manager";
import EcsComponent from "./ecs-component";

import type { EcsEntity } from "./ecs-entity";

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

    let query: EcsEntity[] = [];
    const system = world.watch(
      ({ entities }) => {
        query = [...entities.asEntities()];
      },
      [Position]
    );

    system();
    expect(query).toHaveLength(0);

    const entity = world.spawn().add(Position);
    system();
    expect(query).toHaveLength(1);
    expect(query).toContain(entity);
  });

  it("iterates over components", () => {
    // Given a Position, Velocity-present query
    // And an entity that satisfies the query
    // When I iterate over the query
    // Then I should get the position component directly

    const world = new EcsManager();

    let query: Array<[Position]> = [];
    const system = world.watch(
      ({ entities }) => {
        query = [...entities];
      },
      [Position, Velocity.present()]
    );

    world.spawn().add(Position, { x: 12, y: 144 }).add(Velocity);

    system();
    expect(query).toEqual([[{ x: 12, y: 144 }]]);
  });

  it("iterates over entities", () => {
    // Given a Position, Velocity-present query
    // And an entity that satisfies the query
    // When I iterate over the query.asEntities()
    // Then I should get the entities

    const world = new EcsManager();

    let query: EcsEntity[] = [];
    const system = world.watch(
      ({ entities }) => {
        query = [...entities.asEntities()];
      },
      [Position, Velocity.present()]
    );

    const entity = world.spawn().add(Position).add(Velocity);

    system();
    expect(query).toEqual([entity]);
  });

  it("iterates over entities and components", () => {
    // Given a Position, Velocity-present query
    // And an entity that satisfies the query
    // When I iterate over the query.withEntities()
    // Then I should get the entities + their components

    const world = new EcsManager();

    let query: Array<[EcsEntity, Position]> = [];
    const system = world.watch(
      ({ entities }) => {
        query = [...entities.withEntities()];
      },
      [Position, Velocity.present()]
    );

    const entity = world.spawn().add(Position, { x: 12, y: 144 }).add(Velocity);

    system();
    expect(query).toEqual([[entity, { x: 12, y: 144 }]]);
  });
});
