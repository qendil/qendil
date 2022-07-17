import EcsManager from "./ecs-manager";
import EcsComponent from "./ecs-component";
import EcsSystem from "./ecs-system";

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
    const query = world.watch(Position);

    expect(query.size).toBe(0);

    const entity = world.spawn().add(Position);
    expect([...query.asEntities()]).toContain(entity);
  });

  it("keeps tracks of removed components", () => {
    // Given a Position query
    // And an entity with a Position component
    // When I remove the Position component from the entity
    // Then the query should not contain the entity

    const world = new EcsManager();
    const query = world.watch(Position);

    const entity = world.spawn().add(Position);
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
    const query = world.watch(Position, Rotation);

    expect(query.size).toBe(0);

    const entity = world.spawn().add(Position);
    expect([...query.asEntities()]).not.toContain(entity);

    entity.add(Rotation);
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
    const entity1 = world.spawn().add(Position).add(Velocity);
    const entity2 = world.spawn().add(Position);
    const entity3 = world.spawn().add(Position).add(Velocity).add(Rotation);

    const query = world.watch(Position, Velocity, Rotation.absent());

    expect([...query.asEntities()]).toContain(entity1);
    expect([...query.asEntities()]).not.toContain(entity2);
    expect([...query.asEntities()]).not.toContain(entity3);
  });

  it("handles entity disposal", () => {
    // Given a Position query
    // And an entity with a Position component
    // When I dispose the entity
    // Then the query should not contain the entity

    const world = new EcsManager();
    const query = world.watch(Position);

    const entity = world.spawn().add(Position);
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
    const query = world.watch(Position, Rotation.absent());

    const entity = world.spawn().add(Position);
    expect([...query.asEntities()]).toContain(entity);

    entity.add(Rotation);
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
    const query = world.watch(Position.added());

    const entity = world.spawn().add(Position);
    expect([...query.asEntities()]).toContain(entity);

    query.update();
    expect([...query.asEntities()]).not.toContain(entity);

    entity.remove(Position).add(Position);
    expect([...query.asEntities()]).toContain(entity);
  });

  it("treats existing components as recently added", () => {
    // Given an entity with a Position component
    // When I create a Position-added query
    // Then it should contain the component

    const world = new EcsManager();
    const entity = world.spawn().add(Position);

    const update = world.addSystem(
      new EcsSystem({ entities: [Position.added()] }, ({ entities }) => {
        expect([...entities.asEntities()]).toContain(entity);
      })
    );

    update();
  });

  it("handles changed components", () => {
    // Given an entity with a Position component
    // And an updated Position-changed query
    // When I change the value of the Position component
    // Then the query should contain the entity

    const world = new EcsManager();
    const entity = world.spawn().add(Position);
    const query = world.watch(Position.changed());

    query.update();
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
    const entity = world.spawn().add(Position, { x: 144 });
    const query = world.watch(Position.changed());

    query.update();
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

    const query = world.watch(
      Named,
      Position.added(),
      Velocity.changed(),
      Rotation.absent()
    );

    const entityA = world.spawn().add(Named).add(Rotation).add(Velocity);
    const entityB = world.spawn().add(Named).add(Vehicle).add(Velocity);

    // Make this the initial state
    query.update();

    // Add component
    entityA.add(Position);
    entityB.add(Position);
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
    entityB.add(Velocity, { x: 1 });
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

    const query = world.watch(Position.absent(), Velocity.absent());

    const entity = world.spawn().add(Position).add(Velocity);
    query.update();

    expect([...query.asEntities()]).not.toContain(entity);

    entity.remove(Position);
    query.update();

    expect([...query.asEntities()]).not.toContain(entity);
  });
});
