import EcsManager from "./ecs-manager";
import EcsComponent from "./ecs-component";
import EcsSystem from "./ecs-system";
import EcsResource from "./ecs-resource";

class Position extends EcsComponent {
  public x = 0;
  public y = 0;
}

class DummyResource extends EcsResource {
  public value = "hello";

  public constructor(greeting?: string) {
    super();

    if (greeting !== undefined) {
      this.value = `Hello ${greeting}!`;
    }
  }
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
    // Then the entities should be disposed

    const world = new EcsManager();
    const entity = world.spawn();

    const disposeSpy = vi.spyOn(entity, "dispose");

    world.dispose();
    world.dispose();
    expect(disposeSpy).toHaveBeenCalledOnce();
  });

  it("properly disposes of its resources once", () => {
    // Given a world with resources
    // When I call .dispose() on the world
    // And I call .dispose() on the world again
    // Then the resources should be disposed

    const world = new EcsManager();
    world.addResource(DummyResource);

    const resource = world.getResource(DummyResource);
    const disposeSpy = vi.spyOn(resource, "dispose");

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

  it("fails when attempting to add a resource after disposal", () => {
    // Given a disposed world
    // When I try to a global resource
    // Then I should get an error

    const world = new EcsManager();
    world.dispose();

    expect(() => world.addResource(DummyResource)).toThrowError(
      "Cannot add a resource to a disposed manager."
    );
  });

  it("fails to add an already existing resource", () => {
    // Given a world with a resource
    // When I try to add the same resource again
    // Then I should get an error

    const world = new EcsManager();
    world.addResource(DummyResource);

    expect(() => world.addResource(DummyResource)).toThrowError(
      "A resource of type DummyResource already exists."
    );
  });

  it("retrieves a global resource", () => {
    // Given a world with a resource
    // When I try to get the resource
    // Then I should get the resource

    const world = new EcsManager();
    world.addResource(DummyResource, { value: "144" });

    const resource = world.getResource(DummyResource);
    expect(resource).toEqual({ value: "144" });
  });

  it("fails to retrieve non-existing resources", () => {
    // Given a world
    // When I try to get a non-existing resource
    // Then I should get an error

    const world = new EcsManager();

    expect(() => world.getResource(DummyResource)).toThrowError(
      "A resource of type DummyResource does not exist."
    );
  });

  it("intanciates resources", () => {
    // Given a world with a resource
    // When I try to instantiate the resource
    // Then I should get the resource

    const world = new EcsManager();
    world.addResourceNew(DummyResource, "world");

    const resource = world.getResource(DummyResource);
    expect(resource).toEqual({ value: "Hello world!" });
  });
});

describe("EcsManager system", () => {
  it("forwards arguments", () => {
    // Given a system that accepts 2 arguments
    // When I call the system with those 2 arguments
    // Then I the system's callback should receive those same 2 arguments as parameters

    const world = new EcsManager();

    const system = world.watch(
      (_query, argument1: string, argument2: number) => {
        expect(argument1).toBe("hello");
        expect(argument2).toBe(42);
      },
      [Position]
    );

    system("hello", 42);
  });

  it("forwards callbacks' return values", () => {
    // Given a system with a callback that returns a value
    // When I call the system
    // Then I should receive the return value from the callback

    const world = new EcsManager();
    const system = world.watch(() => "test output", [Position]);

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

    const world = new EcsManager();
    const system = world.watch(({ entities }) => entities, [Position.added()]);

    const query = system();
    const entityA = world.spawn().add(Position);
    const entityB = world.spawn();
    expect([...query.asEntities()]).toContain(entityA);
    expect([...query.asEntities()]).not.toContain(entityB);

    system();
    expect([...query.asEntities()]).not.toContain(entityA);
    expect([...query.asEntities()]).not.toContain(entityB);

    system();
    entityB.add(Position);
    expect([...query.asEntities()]).not.toContain(entityA);
    expect([...query.asEntities()]).toContain(entityB);
  });

  it("queries resources", () => {
    // Given a global resource A
    // When I query the resource A
    // Then it should be exposed in the system's query result

    class A extends EcsResource {
      public value = "hello";
    }

    const world = new EcsManager();
    world.addResource(A, { value: "world" });

    const system = world.watch(({ resources }) => resources, {
      resources: [A],
    });
    const resources = system();

    expect(resources).toEqual([{ value: "world" }]);
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

    const mySystem = new EcsSystem(({ entities }) => [...entities], [Position]);

    const world = new EcsManager();
    world.spawn().insert(Position);
    const system = world.watch(mySystem);

    expect(system()).toBeInstanceOf(Array);
    expect(system()).toHaveLength(1);
  });

  it("accepts alternative syntax for system queries", () => {
    // Given a GameSystem instance
    // When I call `.watch()` with the GameSystem instance
    // Then I should have a proper game system handle

    const mySystem = new EcsSystem(({ entities }) => [...entities], {
      entities: [Position],
    });

    const world = new EcsManager();
    world.spawn().insert(Position);
    const system = world.watch(mySystem);

    expect(system()).toBeInstanceOf(Array);
    expect(system()).toHaveLength(1);
  });
});
