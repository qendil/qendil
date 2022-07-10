import EcsManager from "./ecs-manager";
import EcsComponent from "./ecs-component";

class Position extends EcsComponent {
  public x = 0;
  public y = 0;
}

class Rotation extends EcsComponent {
  public angle = 0;
}

class Velocity extends EcsComponent {
  public x = 0;
  public y = 0;
}

class Named extends EcsComponent {
  public name = "entity";
}

class Vehicle extends EcsComponent {
  public wheels = 4;
}

describe("EcsQueryBuilder", () => {
  it("keeps track of newly added components", () => {
    // Given a Position query
    // When I create a new entity with a Position component
    // Then the query should contain that entity

    const world = new EcsManager();
    const update = world.watch(({ entities }) => entities, [Position]);
    const query = update();

    expect(query.size).toBe(0);

    const entity = world.spawn().insert(Position);
    expect([...query.asEntities()]).toContain(entity);
  });

  it("keeps tracks of removed components", () => {
    // Given a Position query
    // And an entity with a Position component
    // When I remove the Position component from the entity
    // Then the query should not contain the entity

    const world = new EcsManager();
    const update = world.watch(({ entities }) => entities, [Position]);
    const query = update();

    const entity = world.spawn().insert(Position);
    expect([...query.asEntities()]).toContain(entity);

    entity.remove(Position);
    expect(query.size).toBe(0);
  });

  it("keeps track of multiple components", () => {
    // Given a Position and Rotation query
    // When I create a new entity with a Position component
    // Then the query should not contain that entity
    // When I add a rotation component to the entity
    // Then the query should contain that entity

    const world = new EcsManager();
    const update = world.watch(
      ({ entities }) => entities,
      [Position, Rotation]
    );
    const query = update();

    expect(query.size).toBe(0);

    const entity = world.spawn().insert(Position);
    expect([...query.asEntities()]).not.toContain(entity);

    entity.insert(Rotation);
    expect([...query.asEntities()]).toContain(entity);
  });

  it("tracks entities created before the query was created", () => {
    // Given an entity A with Position and Velocity components
    // And an entity B with only a Position component
    // And an entity C with Position, Velocity and Rotation components
    // When I create a Position, Velocity and Rotation-less query
    // Then the query should contain the entity A
    // And the query should not contain the entities B and C

    const world = new EcsManager();
    const entity1 = world.spawn().insert(Position).insert(Velocity);
    const entity2 = world.spawn().insert(Position);
    const entity3 = world
      .spawn()
      .insert(Position)
      .insert(Velocity)
      .insert(Rotation);

    const system = world.watch(
      ({ entities }) => [...entities.asEntities()],
      [Position, Velocity, Rotation.absent()]
    );
    const query = system();

    expect(query).toContain(entity1);
    expect(query).not.toContain(entity2);
    expect(query).not.toContain(entity3);
  });

  it("handles entity disposal", () => {
    // Given a Position query
    // And an entity with a Position component
    // When I dispose the entity
    // Then the query should not contain the entity

    const world = new EcsManager();
    const system = world.watch(({ entities }) => entities, [Position]);
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

    const world = new EcsManager();
    const update = world.watch(
      ({ entities }) => entities,
      [Position, Rotation.absent()]
    );
    const query = update();

    const entity = world.spawn().insert(Position);
    expect([...query.asEntities()]).toContain(entity);

    entity.insert(Rotation);
    expect([...query.asEntities()]).not.toContain(entity);
  });

  it("handles querying recently added components", () => {
    // Given a Position-added query
    // When I create a new entity with a Position component
    // Then the query should contain that entity
    // When I update the query
    // Then the query should no longer contain that entity
    // When I remove then re-add the component to the entity
    // Then the query should contain that entity

    const world = new EcsManager();
    const update = world.watch(({ entities }) => entities, [Position.added()]);
    const query = update();

    const entity = world.spawn().insert(Position);
    expect([...query.asEntities()]).toContain(entity);

    update();
    expect([...query.asEntities()]).not.toContain(entity);

    entity.remove(Position).insert(Position);
    expect([...query.asEntities()]).toContain(entity);
  });

  it("treats existing components as recently added", () => {
    // Given an entity with a Position component
    // When I create a Position-added query
    // Then it should contain the component

    const world = new EcsManager();
    const entity = world.spawn().insert(Position);

    const update = world.watch(
      ({ entities }) => {
        expect([...entities.asEntities()]).toContain(entity);
      },
      [Position.added()]
    );

    update();
  });

  it("handles changed components", () => {
    // Given an entity with a Position component
    // And an updated Position-changed query
    // When I change the value of the Position component
    // Then the query should contain the entity

    const world = new EcsManager();
    const entity = world.spawn().insert(Position);
    const update = world.watch(
      ({ entities }) => entities,
      [Position.changed()]
    );

    const query = update();
    expect([...query.asEntities()]).not.toContain(entity);

    entity.get(Position).x = 1;
    expect([...query.asEntities()]).toContain(entity);
  });

  it("does not consider component updates as changed if the value does not change", () => {
    // Given an entity with a Position component
    // And an updated Position-changed query
    // When I update the value of the Position component to its same value
    // Then the query should not contain the entity

    const world = new EcsManager();
    const entity = world.spawn().insert(Position, { x: 144 });
    const update = world.watch(
      ({ entities }) => entities,
      [Position.changed()]
    );

    const query = update();
    expect([...query.asEntities()]).not.toContain(entity);

    entity.get(Position).x = 144;
    expect([...query.asEntities()]).not.toContain(entity);
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

    const world = new EcsManager();
    const update = world.watch(
      ({ entities }) => entities,
      [Named, Position.added(), Velocity.changed(), Rotation.absent()]
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
    expect([...query.asEntities()]).not.toContain(entityA);
    expect([...query.asEntities()]).not.toContain(entityB);

    // Change component values
    entityA.get(Velocity).x = 1;
    entityB.get(Velocity).x = 1;
    expect([...query.asEntities()]).not.toContain(entityA);
    expect([...query.asEntities()]).toContain(entityB);

    // Change component values before removal
    entityB.get(Velocity).x = 42;

    // Remove previously added component
    entityB.remove(Velocity);
    expect([...query.asEntities()]).not.toContain(entityA);
    expect([...query.asEntities()]).not.toContain(entityB);

    // Re-add removed component
    entityB.insert(Velocity, { x: 1 });
    expect([...query.asEntities()]).not.toContain(entityA);
    expect([...query.asEntities()]).toContain(entityB);

    // Removed filtered-out component
    entityA.remove(Rotation);
    expect([...query.asEntities()]).toContain(entityA);
    expect([...query.asEntities()]).toContain(entityB);

    // Remove unrelated component
    entityB.remove(Vehicle);
    expect([...query.asEntities()]).toContain(entityA);
    expect([...query.asEntities()]).toContain(entityB);
  });

  it("handles removing an excluded component while there are still other excluded components", () => {
    // Given an entity with a Position-less, Velocity-less component
    // When I create a Position-less, Velocity-less entity
    // Then the query should not contain the entity
    // When I remove the Position component
    // Then the query should still not contain the entity

    const world = new EcsManager();
    const update = world.watch(
      ({ entities }) => entities,
      [Position.absent(), Velocity.absent()]
    );
    const query = update();

    const entity = world.spawn().insert(Position).insert(Velocity);
    expect([...query.asEntities()]).not.toContain(entity);

    entity.remove(Position);
    expect([...query.asEntities()]).not.toContain(entity);
  });
});
