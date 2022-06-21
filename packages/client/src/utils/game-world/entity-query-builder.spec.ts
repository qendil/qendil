import GameWorld from "./game-world";
import GameComponent from "./game-component";

class Position extends GameComponent {
  public x = 0;
  public y = 0;
}

class Rotation extends GameComponent {
  public angle = 0;
}

class Velocity extends GameComponent {
  public x = 0;
  public y = 0;
}

class Named extends GameComponent {
  public name = "entity";
}

class Vehicle extends GameComponent {
  public wheels = 4;
}

describe("Entity Query Builder", () => {
  it("keeps track of newly added components", () => {
    // Given a Position query
    // When I create a new entity with a Position component
    // Then the query should contain that entity

    const world = new GameWorld();
    const update = world.watch([Position], (query) => query);
    const query = update();

    expect(query.size).toBe(0);

    const entity = world.spawn().insert(Position);
    expect([...query]).toContain(entity);
  });

  it("keeps tracks of removed components", () => {
    // Given a Position query
    // And an entity with a Position component
    // When I remove the Position component from the entity
    // Then the query should not contain the entity

    const world = new GameWorld();
    const update = world.watch([Position], (query) => query);
    const query = update();

    const entity = world.spawn().insert(Position);
    expect([...query]).toContain(entity);

    entity.remove(Position);
    expect(query.size).toBe(0);
  });

  it("keeps track of multiple components", () => {
    // Given a Position and Rotation query
    // When I create a new entity with a Position component
    // Then the query should not contain that entity
    // When I add a rotation component to the entity
    // Then the query should contain that entity

    const world = new GameWorld();
    const update = world.watch([Position, Rotation], (query) => query);
    const query = update();

    expect(query.size).toBe(0);

    const entity = world.spawn().insert(Position);
    expect([...query]).not.toContain(entity);

    entity.insert(Rotation);
    expect([...query]).toContain(entity);
  });

  it("tracks entities created before the query was created", () => {
    // Given an entity A with Position and Velocity components
    // And an entity B with only a Position component
    // And an entity C with Position, Velocity and Rotation components
    // When I create a Position, Velocity and Rotation-less query
    // Then the query should contain the entity A
    // And the query should not contain the entities B and C

    const world = new GameWorld();
    const system = world.watch(
      [Position, Velocity, Rotation.less()],
      (query) => query
    );
    const entity1 = world.spawn().insert(Position).insert(Velocity);
    const entity2 = world.spawn().insert(Position);
    const entity3 = world
      .spawn()
      .insert(Position)
      .insert(Velocity)
      .insert(Rotation);

    const query = system();

    expect([...query]).toContain(entity1);
    expect([...query]).not.toContain(entity2);
    expect([...query]).not.toContain(entity3);
  });

  it("handles entity disposal", () => {
    // Given a Position query
    // And an entity with a Position component
    // When I dispose the entity
    // Then the query should not contain the entity

    const world = new GameWorld();
    const system = world.watch([Position], (query) => query);
    const query = system();

    const entity = world.spawn().insert(Position);
    expect(query.has(entity)).toBeTruthy();

    entity.dispose();
    expect(query.size).toBe(0);
  });

  it("handles component exclusion", () => {
    // Given a Position/Rotation-less query
    // When I add a Position component to an entity
    // Then the query should contain that entity
    // When I add a Rotation component to the entity
    // Then the query should no longer contain that entity

    const world = new GameWorld();
    const update = world.watch([Position, Rotation.less()], (query) => query);
    const query = update();

    const entity = world.spawn().insert(Position);
    expect([...query]).toContain(entity);

    entity.insert(Rotation);
    expect([...query]).not.toContain(entity);
  });

  it("handles querying recently added components", () => {
    // Given a Position-added query
    // When I create a new entity with a Position component
    // Then the query should contain that entity
    // When I update the query
    // Then the query should no longer contain that entity
    // When I remove then re-add the component to the entity
    // Then the query should contain that entity

    const world = new GameWorld();
    const update = world.watch([Position.added()], (query) => query);
    const query = update();

    const entity = world.spawn().insert(Position);
    expect([...query]).toContain(entity);

    update();
    expect([...query]).not.toContain(entity);

    entity.remove(Position).insert(Position);
    expect([...query]).toContain(entity);
  });

  it("treats existing components as recently added", () => {
    // Given an entity with a Position component
    // When I create a Position-added query
    // Then it should contain the component

    const world = new GameWorld();
    const entity = world.spawn().insert(Position);

    const update = world.watch([Position.added()], (query) => {
      expect([...query]).toContain(entity);
    });

    update();
  });

  it("handles changed components", () => {
    // Given an entity with a Position component
    // And an updated Position-changed query
    // When I change the value of the Position component
    // Then the query should contain the entity

    const world = new GameWorld();
    const entity = world.spawn().insert(Position);
    const update = world.watch([Position.changed()], (query) => query);

    const query = update();
    expect([...query]).not.toContain(entity);

    entity.get(Position).x = 1;
    expect([...query]).toContain(entity);
  });

  it("does not consider component updates as changed if the value does not change", () => {
    // Given an entity with a Position component
    // And an updated Position-changed query
    // When I update the value of the Position component to its same value
    // Then the query should not contain the entity

    const world = new GameWorld();
    const entity = world.spawn().insert(Position, { x: 144 });
    const update = world.watch([Position.changed()], (query) => query);

    const query = update();
    expect([...query]).not.toContain(entity);

    entity.get(Position).x = 144;
    expect([...query]).not.toContain(entity);
  });

  it("handles complex gradual queries", () => {
    // Given a Position-added, Velocity-changed, Rotation-less query
    // When I create an entity A with all 3 components
    // And I create an entity B with Position and Velocity components
    // Then the query should not contain either entity
    // When I change the Velocity component on both components
    // Then the query should contain entity B
    // When I remove Rotation from entity A
    // Then the query should contain both entities

    const world = new GameWorld();
    const update = world.watch(
      [Named, Position.added(), Velocity.changed(), Rotation.less()],
      (query) => query
    );
    const query = update();

    const entityA = world
      .spawn()
      .insert(Named)
      .insert(Rotation)
      .insert(Velocity);

    const entityB = world
      .spawn()
      .insert(Named)
      .insert(Vehicle)
      .insert(Velocity);

    // Make this the initial state
    update();

    // Add component
    entityA.insert(Position);
    entityB.insert(Position);
    expect([...query]).not.toContain(entityA);
    expect([...query]).not.toContain(entityB);

    // Change component values
    entityA.get(Velocity).x = 1;
    entityB.get(Velocity).x = 1;
    expect([...query]).not.toContain(entityA);
    expect([...query]).toContain(entityB);

    // Change component values before removal
    entityB.get(Velocity).x = 42;

    // Remove previously added component
    entityB.remove(Velocity);
    expect([...query]).not.toContain(entityA);
    expect([...query]).not.toContain(entityB);

    // Re-add removed component
    entityB.insert(Velocity, { x: 1 });
    expect([...query]).not.toContain(entityA);
    expect([...query]).toContain(entityB);

    // Removed filtered-out component
    entityA.remove(Rotation);
    expect([...query]).toContain(entityA);
    expect([...query]).toContain(entityB);

    // Remove unrelated component
    entityB.remove(Vehicle);
    expect([...query]).toContain(entityA);
    expect([...query]).toContain(entityB);
  });

  it("handles removing an excluded component while there are still other excluded components", () => {
    // Given an entity with a Position-less, Velocity-less component
    // When I create a Position-less, Velocity-less entity
    // Then the query should not contain the entity
    // When I remove the Position component
    // Then the query should still not contain the entity

    const world = new GameWorld();
    const update = world.watch(
      [Position.less(), Velocity.less()],
      (query) => query
    );
    const query = update();

    const entity = world.spawn().insert(Position).insert(Velocity);
    expect([...query]).not.toContain(entity);

    entity.remove(Position);
    expect([...query]).not.toContain(entity);
  });
});
