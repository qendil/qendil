import EcsManager from "./ecs-manager";
import EcsComponent from "./ecs-component";
import EcsSystem from "./ecs-system";
import EcsResource from "./ecs-resource";

import type { EcsEntity } from "./ecs-entity";

class Position extends EcsComponent {
  public x = 0;
  public y = 0;
}

describe("EcsManager", () => {
  it("properly disposes of its queries once", () => {
    // Given a world with queries
    // When I call .dispose() on the world
    // And I call .dispose() on the world again
    // Then the queries should be disposed

    const world = new EcsManager();
    world.watch(({ entities }) => entities, [Position]);

    /// @ts-expect-error 2341: We need to access the internal queries set
    const [query] = world.queries.get(Position);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const disposeSpy = vi.spyOn(query!, "dispose");

    world.dispose();
    world.dispose();
    expect(disposeSpy).toHaveBeenCalledOnce();
  });

  it("properly disposes of its entities once", () => {
    // Given a world with entities
    // When I call .dispose() on the world
    // And I call .dispose() on the world again
    // Then the entities should be disposed once

    const world = new EcsManager();
    const entity = world.spawn();

    const disposeSpy = vi.spyOn(entity, "dispose");

    world.dispose();
    world.dispose();
    expect(disposeSpy).toHaveBeenCalledOnce();
  });

  it("properly disposes of its resource manager once", () => {
    // Given a world with entities
    // When I call .dispose() on the world
    // And I call .dispose() on the world again
    // Then the resource manager should be disposed once

    const world = new EcsManager();

    const disposeSpy = vi.spyOn(world.resources, "dispose");

    world.dispose();
    world.dispose();
    expect(disposeSpy).toHaveBeenCalledOnce();
  });

  it("fails when attempting to spawn an entity after disposal", () => {
    // Given a disposed world
    // When I try to spawn an entity
    // Then I should get an error

    const world = new EcsManager();
    world.dispose();

    expect(() => world.spawn()).toThrowError(
      "Cannot spawn an entity in a disposed world."
    );
  });

  it("fails when attempting to create a system after disposal", () => {
    // Given a disposed world
    // When I try to create a system
    // Then I should get an error

    const world = new EcsManager();
    world.dispose();

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    expect(() => world.watch(() => {}, [])).toThrowError(
      "Cannot create a system in a disposed world."
    );
  });
});

describe("EcsManager system", () => {
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

    const world = new EcsManager();

    let query: EcsEntity[] = [];
    const system = world.watch(
      ({ entities }) => {
        query = [...entities.asEntities()];
      },
      [Position.added()]
    );

    const entityA = world.spawn().add(Position);
    const entityB = world.spawn();
    system();

    expect(query).toContain(entityA);
    expect(query).not.toContain(entityB);

    // No operation here
    system();

    expect(query).not.toContain(entityA);
    expect(query).not.toContain(entityB);

    entityB.add(Position);
    system();

    expect(query).not.toContain(entityA);
    expect(query).toContain(entityB);
  });

  it("queries resources", () => {
    // Given a global resource A
    // When I query the resource A
    // Then it should be exposed in the system's query result

    class A extends EcsResource {
      public value = "hello";
    }

    const world = new EcsManager();
    world.resources.add(A, { value: "world" });

    let query: EcsResource[] = [];
    const system = world.watch(
      ({ resources }) => {
        query = resources;
      },
      {
        resources: [A],
      }
    );
    system();

    expect(query).toEqual([{ value: "world" }]);
  });

  it("properly disposes of system queries", () => {
    // Given a system that queries for Position components
    // When I call `.dispose()` on the system
    // Then the corresponding query should no longer be tracked

    const world = new EcsManager();
    /// @ts-expect-error 2341: We need to access the internal queries set
    const queries = world.queries.get(Position);

    const system = world.watch(({ entities }) => entities, [Position]);
    expect(queries.size).toBe(1);

    system.dispose();
    expect(queries.size).toBe(0);
  });

  it("properly disposes of system queries queries once", () => {
    // Given a system that queries for Position components
    // When I call `.dispose()` on the system
    // And I call `.dispose()` on the system again
    // Then the corresponding query should no longer be tracked

    const world = new EcsManager();
    /// @ts-expect-error 2341: We need to access the internal queries set
    const queries = world.queries.get(Position);
    const system = world.watch(({ entities }) => entities, [Position]);

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

    let query: Array<[Position]> = [];
    const mySystem = new EcsSystem(
      ({ entities }) => {
        query = [...entities];
      },
      [Position]
    );

    const world = new EcsManager();
    world.spawn().add(Position);

    const system = world.watch(mySystem);

    system();
    expect(query).toBeInstanceOf(Array);

    system();
    expect(query).toHaveLength(1);
  });

  it("accepts alternative syntax for system queries", () => {
    // Given a GameSystem instance
    // When I call `.watch()` with the GameSystem instance
    // Then I should have a proper game system handle

    let query: Array<[Position]> = [];
    const mySystem = new EcsSystem(
      ({ entities }) => {
        query = [...entities];
      },
      {
        entities: [Position],
      }
    );

    const world = new EcsManager();
    world.spawn().add(Position);
    const system = world.watch(mySystem);

    system();
    expect(query).toBeInstanceOf(Array);

    system();
    expect(query).toHaveLength(1);
  });
});
