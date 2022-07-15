import EcsManager from "./ecs-manager";
import EcsComponent from "./ecs-component";
import EcsSystem from "./ecs-system";
import EcsResource from "./ecs-resource";

import type { EcsEntity } from "./ecs-entity";

class Position extends EcsComponent {
  public x = 0;
  public y = 0;
}

class DummyResource extends EcsResource {
  public value = "hello";
}

describe("EcsManager", () => {
  it("properly disposes of its entity queries once", () => {
    // Given a world with entity queries
    // When I call .dispose() on the world
    // And I call .dispose() on the world again
    // Then the queries should be disposed

    const world = new EcsManager();
    world.addSystem(({ entities }) => entities, [Position]);

    /// @ts-expect-error 2341: We need to access the internal queries set
    const [query] = world.entityQueries.get(Position);
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
    expect(() => world.addSystem(() => {}, [])).toThrowError(
      "Cannot create a system in a disposed world."
    );
  });

  it("fails when attempting to create a system without a query", () => {
    // Given a world
    // When I try to create a system without a query
    // Then I should get an error

    const world = new EcsManager();

    // @ts-expect-error 2345: This signature is not valid but possible
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    expect(() => world.addSystem(() => {})).toThrowError(
      "Cannot create a system without a query."
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
    const system = world.addSystem(
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
    const system = world.addSystem(
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
    const queries = world.entityQueries.get(Position);

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const system = world.addSystem(() => {}, [Position]);
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
    const queries = world.entityQueries.get(Position);
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const system = world.addSystem(() => {}, [Position]);

    const [query] = queries;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const disposeSpy = vi.spyOn(query!, "dispose");

    system.dispose();
    system.dispose();
    expect(disposeSpy).toHaveBeenCalledOnce();
  });

  it("accepts alternative syntax for systems", () => {
    // Given a GameSystem instance
    // When I call `.addSystem()` with the GameSystem instance
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

    const system = world.addSystem(mySystem);

    system();
    expect(query).toBeInstanceOf(Array);

    system();
    expect(query).toHaveLength(1);
  });

  it("accepts alternative syntax for system queries", () => {
    // Given a GameSystem instance
    // When I call `.addSystem()` with the GameSystem instance
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
    const system = world.addSystem(mySystem);

    system();
    expect(query).toBeInstanceOf(Array);

    system();
    expect(query).toHaveLength(1);
  });

  it("does not call the callback if the resource query is empty", () => {
    // Given a system with no resources
    // And a system that queries for a resource
    // When I run the system
    // Then the system's callback should not be called

    const world = new EcsManager();
    const callback = vi.fn();
    const system = world.addSystem(callback, { resources: [DummyResource] });

    system();
    expect(callback).not.toHaveBeenCalled();
  });

  it("disposes of related entity queries correctly when disposing of the system", () => {
    // Given a system that queries for some entities
    // When I dispose of the system
    // Then the related entity queries should be properly disposed

    const world = new EcsManager();
    // @ts-expect-error 2341: We need to access the internal queries set
    const { entityQueries } = world;

    world.spawn().add(Position);

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const system = world.addSystem(() => {}, [Position]);
    expect(entityQueries.get(Position).size).toBe(1);

    system.dispose();
    expect(entityQueries.get(Position).size).toBe(0);
  });

  it("disposes of related resource queries correctly when disposing of the system", () => {
    // Given a system that queries for some resources
    // When I dispose of the system
    // Then the related resource queries should be properly disposed

    const world = new EcsManager();
    // @ts-expect-error 2341: We need to access the internal queries set
    const { resourceQueries, resources } = world;

    resources.add(DummyResource);

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const system = world.addSystem(() => {}, {
      resources: [DummyResource.changed()],
    });
    expect(resourceQueries.get(DummyResource).size).toBe(1);

    system.dispose();
    expect(resourceQueries.get(DummyResource).size).toBe(0);
  });

  it("runs commands at the end of a system run", () => {
    // Given a system that runs entity-spawning commands
    // When I call the system
    // Then the entities should be spawned

    const world = new EcsManager();
    const spawningSystem = world.addSystem(({ command }) => {
      command((manager) => {
        manager.spawn().add(Position, { x: 144, y: 12 });
      });
    }, []);

    let query: Array<[Position]> = [];
    const querySystem = world.addSystem(
      ({ entities }) => {
        query = [...entities];
      },
      [Position]
    );

    querySystem();
    expect(query).toHaveLength(0);

    spawningSystem();
    querySystem();

    expect(query).toHaveLength(1);
    expect(query).toEqual([[{ x: 144, y: 12 }]]);
  });

  it("cleans up commands after each run", () => {
    // Given a system that runs a command that spawns a single entity
    // When I call the system 3 times
    // Then only 3 entities should be spawned

    const world = new EcsManager();
    const spawningSystem = world.addSystem(({ command }) => {
      command((manager) => {
        manager.spawn().add(Position);
      });
    }, []);

    let query: EcsEntity[] = [];
    const querySystem = world.addSystem(
      ({ entities }) => {
        query = [...entities.asEntities()];
      },
      [Position]
    );

    querySystem();
    expect(query).toHaveLength(0);

    spawningSystem();
    spawningSystem();
    spawningSystem();
    querySystem();

    expect(query).toHaveLength(3);
  });
});

describe("EcsManager resources", () => {
  it("considers previously added resources as changed resources", () => {
    // Given a resource A in the resource manager
    // When I create a system that queries for changes on A
    // And I run that system
    // Then the system's callback should be called

    const world = new EcsManager();
    world.resources.add(DummyResource);

    const callback = vi.fn();
    const system = world.addSystem(callback, {
      resources: [DummyResource.changed()],
    });

    system();
    expect(callback).toHaveBeenCalled();
  });

  it("considers newly added resources as changed resources", () => {
    // Given a resource A that's not in the ECS manager
    // And a system that queries for changes on A
    // When I run the system
    // Then the system's callback should be called
    // When the resource A is added to the ECS manager
    // And I run the system
    // Then the system's callback should be called

    const world = new EcsManager();

    const callback = vi.fn();
    const system = world.addSystem(callback, {
      resources: [DummyResource.changed()],
    });

    // First call to the system to reset its "changed" flags
    system();

    callback.mockClear();
    system();
    expect(callback).not.toHaveBeenCalled();

    callback.mockClear();
    world.resources.add(DummyResource);
    system();
    expect(callback).toHaveBeenCalled();
  });

  it("queries changed resources", () => {
    // Given a resource A
    // And a system that queries for changed A
    // When I run the system
    // Then its callback should not run
    // When I change the resource A
    // And I run the system
    // Then the system's callback should run

    const world = new EcsManager();
    world.resources.add(DummyResource);

    const callback = vi.fn();
    const system = world.addSystem(callback, {
      resources: [DummyResource.changed()],
    });

    // First call to the system to reset its "changed" flags
    system();

    callback.mockClear();
    system();
    expect(callback).not.toHaveBeenCalled();

    const resource = world.resources.get(DummyResource);
    resource.value = "cheers";

    callback.mockClear();
    system();
    expect(callback).toHaveBeenCalled();
  });
});
