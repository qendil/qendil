import type {
  default as EcsResource,
  EcsResourceConstructor,
} from "./ecs-resource";

export default class EcsResourceManager {
  private disposed = false;

  private readonly resources = new Map<EcsResourceConstructor, EcsResource>();

  /**
   * Disposes of all resources of this manager
   */
  public dispose(): void {
    if (this.disposed) return;

    for (const resource of this.resources.values()) {
      resource.dispose();
    }

    this.resources.clear();

    this.disposed = true;
  }

  /**
   * Add a global resource.
   *
   * @param constructor - The constructor of the resource to add
   * @param properties - Initial properties of the resource
   * @returns The manager itself
   */
  public add<T extends EcsResource>(
    constructor: EcsResourceConstructor<T>,
    properties?: Partial<T>
  ): this {
    const resource = new constructor();
    if (properties !== undefined) {
      Object.assign(resource, properties);
    }

    return this.addResource(resource);
  }

  /**
   * Instanciate and add a global resource.
   *
   * @param constructor - The constructor of the resource to add
   * @param args - The parameters to pass to the constructor
   * @returns The manager itself
   */
  public addNew<T extends EcsResource, TArgs extends any[]>(
    constructor: EcsResourceConstructor<T, TArgs>,
    ...args: TArgs
  ): this {
    const resource = new constructor(...args);

    return this.addResource(resource);
  }

  /**
   * Used interally to add and wrap a resource instance.
   *
   * @param resource - The resource instance to add
   * @returns The manager itself
   */
  private addResource<T extends EcsResource>(resource: T): this {
    // Extract the constructor type
    const { constructor } = Object.getPrototypeOf(resource) as {
      constructor: EcsResourceConstructor<T>;
    };

    // Make sure this manager was not disposed
    if (this.disposed) {
      throw new Error("Cannot add a resource to a disposed manager.");
    }

    // Make sure this resource was not already added
    if (this.resources.has(constructor)) {
      throw new Error(`A resource of type ${constructor.name} already exists.`);
    }

    // TODO: Wrap the resource with a proxy to monitor changes

    this.resources.set(constructor, resource);
    // TODO: Trigger Add hook for the resource

    return this;
  }

  /**
   * Get a global resource.
   *
   * @param constructor - The constructor of the resource to get
   * @returns The resource instance
   */
  public get<T extends EcsResource>(constructor: EcsResourceConstructor<T>): T {
    if (!this.has(constructor)) {
      throw new Error(`A resource of type ${constructor.name} does not exist.`);
    }

    return this.resources.get(constructor) as T;
  }

  /**
   * Check if a global resource exists.
   *
   * @param constructor - The constructor of the resource to check
   * @returns Whether the resource exists
   */
  public has<T extends EcsResource>(
    constructor: EcsResourceConstructor<T>
  ): boolean {
    return this.resources.has(constructor);
  }

  /**
   * Check if all of the given resources are present
   *
   * @param resources - The resources to check for
   * @returns `true` if all of the resources are present
   */
  public hasAll(resources: Iterable<EcsResourceConstructor>): boolean {
    for (const resource of resources) {
      if (!this.resources.has(resource)) return false;
    }

    return true;
  }

  /**
   * Check if any of the given components are mapped to this entity.
   *
   * @param resources - The components to check for
   * @returns `true` if any of the components are mapped to this entity
   */
  public hasAny(resources: Iterable<EcsResourceConstructor>): boolean {
    for (const resource of resources) {
      if (this.resources.has(resource)) return true;
    }

    return false;
  }
}
