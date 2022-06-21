import GameWorld from "./game-world";
import GameComponent from "./game-component";

class Position extends GameComponent {
  public x = 0;
  public y = 0;

  public constructor(x = 0, y = 0) {
    super();

    this.x = x;
    this.y = y;
  }
}

class Velocity extends GameComponent {
  public x = 0;
  public y = 0;
}

describe("GameEntity", () => {
  it("adds components", () => {
    // Given an entity
    // When I insert a Position component
    // Then the component should be added to the entity

    const world = new GameWorld();
    const entity = world.spawn().insert(Position);

    const components = entity.getComponents();
    expect(components).toContain(Position);
  });

  it("retrieves components", () => {
    // Given an entity with a Position component
    // When I call .get() with the component
    // Then I should get the component with the correct values

    const world = new GameWorld();
    const entity = world.spawn().insert(Position, { x: 42, y: 144 });

    expect(entity.get(Position)).toEqual({ x: 42, y: 144 });
  });

  it("removes components", () => {
    // Given a component with two components: Position and Velocity
    // When I remove the Position component
    // Then the Velocity component should still be present
    // And the Position component should not be present

    const world = new GameWorld();
    const entity = world.spawn().insert(Position).insert(Velocity);

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

    const world = new GameWorld();
    const entity = world.spawn().insert(Position);

    expect(entity.has(Position)).toBe(true);
  });

  test("has() returns false when the given component is not present", () => {
    // Given an entity with a Position component
    // When I call .has() with the Velocity component
    // Then I should get false

    const world = new GameWorld();
    const entity = world.spawn().insert(Position);

    expect(entity.has(Velocity)).toBe(false);
  });

  test("hasAll() returns true when all given components are present", () => {
    // Given an entity with two components: Position and Velocity
    // When I call .hasAll() with the Position and Velocity components
    // Then I should get true

    const world = new GameWorld();
    const entity = world.spawn().insert(Position).insert(Velocity);

    expect(entity.hasAll([Position, Velocity])).toBe(true);
  });

  test("hasAll() returns false when all given components are not present", () => {
    // Given an entity with onw component: Position
    // When I call .hasAll() with the Position and Velocity components
    // Then I should get false

    const world = new GameWorld();
    const entity = world.spawn().insert(Position);

    expect(entity.hasAll([Position, Velocity])).toBe(false);
  });

  test("hasAny() returns true when any of the given components are present", () => {
    // Given an entity with one component: Position
    // When I call .hasAny() with the Position and Velocity components
    // Then I should get true

    const world = new GameWorld();
    const entity = world.spawn().insert(Position);

    expect(entity.hasAny([Position, Velocity])).toBe(true);
  });

  test("hasAny() returns false when none of the given components are present", () => {
    // Given an entity with no components
    // When I call .hasAny() with the Position and Velocity components
    // Then I should get false

    const world = new GameWorld();
    const entity = world.spawn();

    expect(entity.hasAny([Position, Velocity])).toBe(false);
  });

  it("fails when adding a component that already exists", () => {
    // Given an entity with the Position component
    // When I try to insert another Position component
    // Then I should get an error

    const world = new GameWorld();
    const entity = world.spawn().insert(Position);

    expect(() => entity.insert(Position)).toThrowError(
      `Cannot add component ${Position.name} to entity ${entity.id} because it already exists.`
    );
  });

  it("fails when retrieving a component that does not exist", () => {
    // Given an entity with no components
    // When I try to get the Position component
    // Then I should get an error

    const world = new GameWorld();
    const entity = world.spawn();

    expect(() => entity.get(Position)).toThrowError(
      `Cannot retrieve component ${Position.name} from entity ${entity.id} because it does not exist.`
    );
  });

  test("insert() accepts a component with a value", () => {
    // Given an entity
    // When I call .add() with a component and a value
    // Then the entity should have a component with the correct value

    const world = new GameWorld();
    const entity = world.spawn().insert(Position, { x: 42, y: 144 });

    expect(entity.get(Position)).toEqual({ x: 42, y: 144 });
  });

  test("insert() accepts an instance of a component", () => {
    // Given an entity
    // When I call .add() with an instance of a component
    // Then the entity should have a component with the correct value

    const world = new GameWorld();
    const entity = world.spawn().insert(new Position(42, 144));

    expect(entity.get(Position)).toEqual({ x: 42, y: 144 });
  });

  it("disposes of the components when disposing the entity", () => {
    // Given an entity with a Position component
    // When I call .dispose() on the entity
    // Then .dispose() should be called on the components too

    const world = new GameWorld();
    const entity = world.spawn().insert(Position);

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

    const world = new GameWorld();
    const entity = world.spawn().insert(Position);

    const position = entity.get(Position);
    const disposeSpy = vi.spyOn(position, "dispose");

    entity.dispose();
    entity.dispose();
    expect(disposeSpy).toHaveBeenCalledOnce();
  });

  it("fails when attempting to insert a component into a disposed entity", () => {
    // Given a disposed entity
    // When I try to add a component to it
    // Then I should get an error

    const world = new GameWorld();
    const entity = world.spawn();
    entity.dispose();

    expect(() => entity.insert(Position)).toThrowError(
      `Cannot insert component ${Position.name} into entity ${entity.id} because it has been disposed.`
    );
  });

  it("fails when attempting to remove a component from a disposed entity", () => {
    // Given a disposed entity
    // When I try to remove a component from it
    // Then I should get an error

    const world = new GameWorld();
    const entity = world.spawn().insert(Position);
    entity.dispose();

    expect(() => entity.remove(Position)).toThrowError(
      `Cannot remove component ${Position.name} from entity ${entity.id} because it has been disposed.`
    );
  });
});
