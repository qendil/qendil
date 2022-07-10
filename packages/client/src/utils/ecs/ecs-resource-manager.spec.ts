import EcsResource from "./ecs-resource";
import EcsResourceManager from "./ecs-resource-manager";

class DummyResource extends EcsResource {
  public value = "hello";

  public constructor(greeting?: string) {
    super();

    if (greeting !== undefined) {
      this.value = `Hello ${greeting}!`;
    }
  }
}

class FakeResource extends EcsResource {}

describe("EcsResourceManager", () => {
  it("adds resources", () => {
    // Given a resource manager
    // When I try to add a resource
    // Then the resource should be created

    const manager = new EcsResourceManager();
    manager.addNew(DummyResource, "world");

    const resource = manager.get(DummyResource);
    expect(resource).toEqual({ value: "Hello world!" });
  });

  it("intanciates resources", () => {
    // Given a resource manager
    // When I try to instantiate a resource
    // Then the resource should be created

    const manager = new EcsResourceManager();
    manager.addNew(DummyResource, "world");

    const resource = manager.get(DummyResource);
    expect(resource).toEqual({ value: "Hello world!" });
  });

  it("fails when attempting to add a resource after disposal", () => {
    // Given a disposed resource manager
    // When I try to a global resource
    // Then I should get an error

    const manager = new EcsResourceManager();
    manager.dispose();

    expect(() => manager.add(DummyResource)).toThrowError(
      "Cannot add a resource to a disposed manager."
    );
  });

  it("fails to add an already existing resource", () => {
    // Given a resource manager with a resource
    // When I try to add the same resource again
    // Then I should get an error

    const manager = new EcsResourceManager();
    manager.add(DummyResource);

    expect(() => manager.add(DummyResource)).toThrowError(
      "A resource of type DummyResource already exists."
    );
  });

  it("retrieves a global resource", () => {
    // Given a resource manager with a resource
    // When I try to get the resource
    // Then I should get the resource

    const manager = new EcsResourceManager();
    manager.add(DummyResource, { value: "144" });

    const resource = manager.get(DummyResource);
    expect(resource).toEqual({ value: "144" });
  });

  it("fails to retrieve non-existing resources", () => {
    // Given a resource manager
    // When I try to get a non-existing resource
    // Then I should get an error

    const manager = new EcsResourceManager();

    expect(() => manager.get(DummyResource)).toThrowError(
      "A resource of type DummyResource does not exist."
    );
  });

  it("properly disposes of its resources once", () => {
    // Given a resource manager with resources
    // When I call .dispose() on the world
    // And I call .dispose() on the world again
    // Then the resources should be disposed

    const manager = new EcsResourceManager();
    manager.add(DummyResource);

    const resource = manager.get(DummyResource);
    const disposeSpy = vi.spyOn(resource, "dispose");

    manager.dispose();
    manager.dispose();
    expect(disposeSpy).toHaveBeenCalledOnce();
  });

  it("checks for the presence of a resource", () => {
    // Given a resource manager with a resource A
    // When I check for the presence of resource A
    // Then I should get true

    const manager = new EcsResourceManager();
    manager.add(DummyResource);

    expect(manager.has(DummyResource)).toBe(true);
  });

  it("checks for the absence of a resource", () => {
    // Given a resource manager without a resource A
    // When I check for the presence of resource A
    // Then I should get false

    const manager = new EcsResourceManager();

    expect(manager.has(DummyResource)).toBe(false);
  });

  it("checks for the presence of all resources of a list", () => {
    // Given a resource manager with resources A and B
    // When I check for the presence of resources A and B
    // Then I should get true

    const manager = new EcsResourceManager();
    manager.add(DummyResource).add(FakeResource);

    expect(manager.hasAll([DummyResource, FakeResource])).toBe(true);
  });

  it("checks for the absence of some resources of a list", () => {
    // Given a resource manager with resource A
    // When I check for the presence of resources A and B
    // Then I should get false

    const manager = new EcsResourceManager();
    manager.add(DummyResource);

    expect(manager.hasAll([DummyResource, FakeResource])).toBe(false);
  });

  it("checks for the presence of any resources from a list", () => {
    // Given a resource manager with resource A
    // When I check for the presence of resources A or B
    // Then I should get true

    const manager = new EcsResourceManager();
    manager.add(DummyResource);

    expect(manager.hasAny([DummyResource, FakeResource])).toBe(true);
  });

  it("checks for the absence of all resources of a list", () => {
    // Given a resource manager with no resources
    // When I check for the presence of resources A or B
    // Then I should get false

    const manager = new EcsResourceManager();

    expect(manager.hasAny([DummyResource, FakeResource])).toBe(false);
  });
});
