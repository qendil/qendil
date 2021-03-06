import EcsManager from "./ecs-manager";
import EcsComponent from "./ecs-component";

class Position extends EcsComponent {
  public x = 0;
  public y = 0;

  public constructor(x = 0, y = 0) {
    super();

    this.x = x;
    this.y = y;
  }
}

class Velocity extends EcsComponent {
  public x = 0;
  public y = 0;
}

describe("EcsEntity", () => {
  it("adds components", () => {
    // Given an entity
    // When I insert a Position component
    // Then the component should be added to the entity

    const world = new EcsManager();
    const entity = world.spawn().add(Position);

    const components = entity.getComponents();
    expect(components).toContain(Position);
  });

  it("retrieves components", () => {
    // Given an entity with a Position component
    // When I call .get() with the component
    // Then I should get the component with the correct values

    const world = new EcsManager();
    const entity = world.spawn().add(Position, { x: 42, y: 144 });

    expect(entity.get(Position)).toEqual({ x: 42, y: 144 });
  });

  it("returns undefined when trying to retrieve inexistent component", () => {
    // Given an entity without a Position component
    // When I call .tryGet() with the component
    // Then I should get undefined

    const world = new EcsManager();
    const entity = world.spawn();

    expect(entity.tryGet(Position)).toBeUndefined();
  });

  it("removes components", () => {
    // Given a component with two components: Position and Velocity
    // When I remove the Position component
    // Then the Velocity component should still be present
    // And the Position component should not be present

    const world = new EcsManager();
    const entity = world.spawn().add(Position).add(Velocity);

    const components = entity.getComponents();
    expect(components).toContain(Position);
    expect(components).toContain(Velocity);

    entity.remove(Position);

    const components2 = entity.getComponents();
    expect(components2).not.toContain(Position);
    expect(components2).toContain(Velocity);
  });

  test("has() returns true when the given component is present", () => {
    // Given an entity with a Position component
    // When I call .has() with the Position component
    // Then I should get true

    const world = new EcsManager();
    const entity = world.spawn().add(Position);

    expect(entity.has(Position)).toBe(true);
  });

  test("has() returns false when the given component is not present", () => {
    // Given an entity with a Position component
    // When I call .has() with the Velocity component
    // Then I should get false

    const world = new EcsManager();
    const entity = world.spawn().add(Position);

    expect(entity.has(Velocity)).toBe(false);
  });

  test("hasAll() returns true when all given components are present", () => {
    // Given an entity with two components: Position and Velocity
    // When I call .hasAll() with the Position and Velocity components
    // Then I should get true

    const world = new EcsManager();
    const entity = world.spawn().add(Position).add(Velocity);

    expect(entity.hasAll([Position, Velocity])).toBe(true);
  });

  test("hasAll() returns false when all given components are not present", () => {
    // Given an entity with onw component: Position
    // When I call .hasAll() with the Position and Velocity components
    // Then I should get false

    const world = new EcsManager();
    const entity = world.spawn().add(Position);

    expect(entity.hasAll([Position, Velocity])).toBe(false);
  });

  test("hasAny() returns true when any of the given components are present", () => {
    // Given an entity with one component: Position
    // When I call .hasAny() with the Position and Velocity components
    // Then I should get true

    const world = new EcsManager();
    const entity = world.spawn().add(Position);

    expect(entity.hasAny([Position, Velocity])).toBe(true);
  });

  test("hasAny() returns false when none of the given components are present", () => {
    // Given an entity with no components
    // When I call .hasAny() with the Position and Velocity components
    // Then I should get false

    const world = new EcsManager();
    const entity = world.spawn();

    expect(entity.hasAny([Position, Velocity])).toBe(false);
  });

  it("fails when adding a component that already exists", () => {
    // Given an entity with the Position component
    // When I try to insert another Position component
    // Then I should get an error

    const world = new EcsManager();
    const entity = world.spawn().add(Position);

    expect(() => entity.add(Position)).toThrowError(
      `Cannot add component ${Position.name} to entity ${entity.id} because it already exists.`
    );
  });

  it("fails when retrieving a component that does not exist", () => {
    // Given an entity with no components
    // When I try to get the Position component
    // Then I should get an error

    const world = new EcsManager();
    const entity = world.spawn();

    expect(() => entity.get(Position)).toThrowError(
      `Cannot retrieve component ${Position.name} from entity ${entity.id} because it does not exist.`
    );
  });

  test("add() accepts a component with a value", () => {
    // Given an entity
    // When I call .add() with a component and a value
    // Then the entity should have a component with the correct value

    const world = new EcsManager();
    const entity = world.spawn().add(Position, { x: 42, y: 144 });

    expect(entity.get(Position)).toEqual({ x: 42, y: 144 });
  });

  test("addNew() instanciates and adds a component", () => {
    // Given an entity
    // When I call .insertNew() with an instance of a component
    // Then the entity should have a component with the correct value

    const world = new EcsManager();
    const entity = world.spawn().addNew(Position, 42, 144);

    expect(entity.get(Position)).toEqual({ x: 42, y: 144 });
  });

  it("disposes of the components when it's removed", () => {
    // Given an entity with a Position component
    // When I remove the Position component
    // Then .dispose() should be called on the Position component

    const world = new EcsManager();
    const entity = world.spawn().add(Position);

    const position = entity.get(Position);
    const disposeSpy = vi.spyOn(position, "dispose");

    entity.remove(Position);
    expect(disposeSpy).toHaveBeenCalledOnce();
  });

  it("disposes of the components when it's removed once", () => {
    // Given an entity with a Position component
    // When I remove the Position component
    // And I attempt to remove the component again
    // Then .dispose() should be called on the Position component

    const world = new EcsManager();
    const entity = world.spawn().add(Position);

    const position = entity.get(Position);
    const disposeSpy = vi.spyOn(position, "dispose");

    entity.remove(Position);
    entity.remove(Position);
    expect(disposeSpy).toHaveBeenCalledOnce();
  });

  it("exposes the entity when removing the component", () => {
    // Given an entity with a Position component
    // When I remove the Position component
    // Then the component should be able to access the entity on disposal

    const world = new EcsManager();
    const entity = world.spawn().add(Position);

    const position = entity.get(Position);
    const disposeSpy = vi.spyOn(position, "dispose");

    entity.remove(Position);
    expect(disposeSpy).toHaveBeenCalledWith(entity);
  });

  it("disposes of the components when disposing the entity", () => {
    // Given an entity with a Position component
    // When I call .dispose() on the entity
    // Then .dispose() should be called on the components too

    const world = new EcsManager();
    const entity = world.spawn().add(Position);

    const position = entity.get(Position);
    const disposeSpy = vi.spyOn(position, "dispose");

    entity.dispose();
    expect(disposeSpy).toHaveBeenCalledOnce();
  });

  it("disposes of the components when disposing the entity, once", () => {
    // Given an entity with a Position component
    // When I call .dispose() on the entity
    // And I call .dispose() on the entity again
    // Then .dispose() should be called on the components too

    const world = new EcsManager();
    const entity = world.spawn().add(Position);

    const position = entity.get(Position);
    const disposeSpy = vi.spyOn(position, "dispose");

    entity.dispose();
    entity.dispose();
    expect(disposeSpy).toHaveBeenCalledOnce();
  });

  it("exposes the entity to the components when disposing the entity", () => {
    // Given an entity with a Position component
    // When I dispose the entity
    // Then the component should be able to access the entity on disposal

    const world = new EcsManager();
    const entity = world.spawn().add(Position);

    const position = entity.get(Position);
    const disposeSpy = vi.spyOn(position, "dispose");

    entity.dispose();
    expect(disposeSpy).toHaveBeenCalledWith(entity);
  });

  it("fails when attempting to insert a component into a disposed entity", () => {
    // Given a disposed entity
    // When I try to add a component to it
    // Then I should get an error

    const world = new EcsManager();
    const entity = world.spawn();
    entity.dispose();

    expect(() => entity.add(Position)).toThrowError(
      `Cannot insert component ${Position.name} into entity ${entity.id} because it has been disposed.`
    );
  });

  it("fails when attempting to remove a component from a disposed entity", () => {
    // Given a disposed entity
    // When I try to remove a component from it
    // Then I should get an error

    const world = new EcsManager();
    const entity = world.spawn().add(Position);
    entity.dispose();

    expect(() => entity.remove(Position)).toThrowError(
      `Cannot remove component ${Position.name} from entity ${entity.id} because it has been disposed.`
    );
  });
});
