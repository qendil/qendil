import type {
  default as EcsComponent,
  EcsComponentConstructor,
} from "./ecs-component";

/**
 * Lifecycle hooks privately exposed by the ECS manager.
 *
 * @internal
 */
export type EcsEntityLifecycleHooks = {
  onDispose: (entity: EcsEntity) => void;
  onComponentAdded: (
    entity: EcsEntity,
    component: EcsComponentConstructor
  ) => void;
  onComponentRemoved: (
    entity: EcsEntity,
    component: EcsComponentConstructor
  ) => void;
  onComponentChanged: (
    entity: EcsEntity,
    component: EcsComponentConstructor
  ) => void;
};

/**
 * An entity in the game world.
 *
 * Contains no data in and of itself, aside from an ID.
 * Instead, it maps to one or multiple components, which are used to
 *  filter and query entities in GameSystems.
 *
 * @important You should call `dispose()` on the returned entity when you
 *  are done with it, to remove it from the world.
 */
export class EcsEntity {
  public readonly id: number;
  private readonly hooks: EcsEntityLifecycleHooks;
  private disposed = false;

  private readonly components = new Map<
    EcsComponentConstructor,
    EcsComponent
  >();

  public constructor(id: number, hooks: EcsEntityLifecycleHooks) {
    this.id = id;
    this.hooks = hooks;
  }

  /**
   * Removes the entity and all of its components from the game world.
   */
  public dispose(): void {
    if (this.disposed) return;

    for (const component of this.components.values()) {
      component.dispose(this);
    }

    this.hooks.onDispose(this);

    // Imporant: this should come after hooks.onDispose()
    // since it might still use some of its components to make a diff
    this.components.clear();

    this.disposed = true;
  }

  /**
   * Intanciate and add a component to the entity.
   *
   * @param constructor - The component to add
   * @param args - Values to pass to the constructor when creating the component
   * @returns The entity itself
   */
  public addNew<T extends EcsComponent, TArgs extends any[]>(
    constructor: EcsComponentConstructor<T, TArgs>,
    ...args: TArgs
  ): this {
    const component = new constructor(...args);

    return this.addComponent(component);
  }

  /**
   * Add a component to the entity.
   *
   * @param constructor - The component to add
   * @param values - Initial values for the component
   * @returns The entity itself
   */
  public add<T extends EcsComponent>(
    constructor: EcsComponentConstructor<T>,
    values?: Partial<Record<keyof T, any>>
  ): this {
    const component = new constructor();
    if (values !== undefined) {
      Object.assign(component, values);
    }

    return this.addComponent(component);
  }

  /**
   * Used internally to add and wrap a component to the entity
   *
   * @param component - The component instance to add
   * @returns The entity itself
   */
  private addComponent<T extends EcsComponent>(component: T): this {
    // Extract the constructor type
    const { constructor } = Object.getPrototypeOf(component) as {
      constructor: EcsComponentConstructor<T>;
    };

    // Make sure the entity was not disposed
    if (this.disposed) {
      throw new Error(
        `Cannot insert component ${constructor.name} into entity ${this.id} because it has been disposed.`
      );
    }

    // Make sure the component is not duplacted
    if (this.components.has(constructor)) {
      throw new Error(
        `Cannot add component ${constructor.name} to entity ${this.id} because it already exists.`
      );
    }

    // Wrap the component with a proxy to monitor changes
    const proxy = new Proxy(component, {
      set: (target, key, value): boolean => {
        const originalValue = Reflect.get(target, key) as unknown;

        const result = Reflect.set(target, key, value);

        // Make sure to trigger the hook after the component has been updated
        if (value !== originalValue) {
          this.hooks.onComponentChanged(this, constructor);
        }

        return result;
      },
    });

    this.components.set(constructor, proxy);
    this.hooks.onComponentAdded(this, constructor);

    return this;
  }

  /**
   * Remove a component from the entity.
   *
   * @param constructor - Component to remove
   * @returns The entity itself
   */
  public remove<T extends EcsComponent>(
    constructor: EcsComponentConstructor<T>
  ): this {
    if (this.disposed) {
      throw new Error(
        `Cannot remove component ${constructor.name} from entity ${this.id} because it has been disposed.`
      );
    }

    const component = this.components.get(constructor);
    if (component !== undefined) {
      this.components.delete(constructor);
      component.dispose(this);
      this.hooks.onComponentRemoved(this, constructor);
    }

    return this;
  }

  /**
   * Retrieve a single mapped component from this entity.
   *
   * @throws If the component is not mapped to this entity.
   * @param constructor - The component to retrieve
   * @returns A component
   */
  public get<T extends EcsComponent>(
    constructor: EcsComponentConstructor<T>
  ): T {
    const component = this.tryGet(constructor);

    if (component === undefined) {
      throw new Error(
        `Cannot retrieve component ${constructor.name} from entity ${this.id} because it does not exist.`
      );
    }

    return component;
  }

  /**
   * Retrieve as single mapped component from this entity if it exists,
   * otherwise return `undefined`.
   *
   * @param constructor - The component to retrieve
   * @returns A component or `undefined`
   */
  public tryGet<T extends EcsComponent>(
    constructor: EcsComponentConstructor<T>
  ): T | undefined {
    return this.components.get(constructor) as T | undefined;
  }

  /**
   * Check if a given component is mapped to this entity.
   *
   * @param component - The component to check for
   * @returns `true` if the component is mapped to this entity
   */
  public has<T extends EcsComponent>(
    component: EcsComponentConstructor<T>
  ): boolean {
    return this.components.has(component);
  }

  /**
   * Check if all of the given components are mapped to this entity.
   *
   * @param components - The components to check for
   * @returns `true` if all of the components are mapped to this entity
   */
  public hasAll(components: Iterable<EcsComponentConstructor>): boolean {
    for (const component of components) {
      if (!this.components.has(component)) return false;
    }

    return true;
  }

  /**
   * Check if any of the given components are mapped to this entity.
   *
   * @param components - The components to check for
   * @returns `true` if any of the components are mapped to this entity
   */
  public hasAny(components: Iterable<EcsComponentConstructor>): boolean {
    for (const component of components) {
      if (this.components.has(component)) return true;
    }

    return false;
  }

  /**
   * Get the components that are mapped to this entity.
   *
   * @returns An iterable of all components mapped to this entity
   */
  public getComponents(): Iterable<EcsComponentConstructor> {
    return this.components.keys();
  }
}
