import type GameComponent from "./game-component";
import type { GameComponentConstructor } from "./game-component";

/**
 * Lifecycle hooks privately exposed by the game world.
 *
 * @internal
 */
export type GameEntityLifecycleHooks = {
  onDispose: (entity: GameEntity) => void;
  onComponentAdded: (
    entity: GameEntity,
    component: GameComponentConstructor
  ) => void;
  onComponentRemoved: (
    entity: GameEntity,
    component: GameComponentConstructor
  ) => void;
  onComponentChanged: (
    entity: GameEntity,
    component: GameComponentConstructor
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
export abstract class GameEntity {
  public readonly id: number;
  protected readonly hooks: GameEntityLifecycleHooks;
  protected disposed = false;

  protected readonly components = new Map<
    GameComponentConstructor,
    GameComponent
  >();

  protected constructor(id: number, hooks: GameEntityLifecycleHooks) {
    this.id = id;
    this.hooks = hooks;
  }

  /**
   * Removes the entity and all of its components from the game world.
   */
  public dispose(): void {
    if (this.disposed) return;
    this.disposed = true;

    for (const component of this.components.values()) {
      component.dispose();
    }

    this.hooks.onDispose(this);
  }

  /**
   * Creates a new component and adds it to the entity.
   * This is different from `insert` because it calls the component's
   *  constructor with the passed arguments.
   *
   * @param constructor - The component to add
   * @param args - Values to pass to the constructor when creating the component
   * @returns The entity itself
   */
  public insertNew<T extends GameComponent, TArgs extends any[]>(
    constructor: GameComponentConstructor<T, TArgs>,
    ...args: TArgs
  ): this {
    const component = new constructor(...args);

    return this.insertComponent(constructor, component);
  }

  /**
   * Add a component to the entity.
   *
   * @param constructor - The component to add
   * @param values - Initial values for the component
   * @returns The entity itself
   */
  public insert<T extends GameComponent>(
    constructor: GameComponentConstructor<T>,
    values?: Partial<Record<keyof T, any>>
  ): this {
    const component = new constructor();
    if (values !== undefined) {
      Object.assign(component, values);
    }

    return this.insertComponent(constructor, component);
  }

  /**
   * Used internally to add and wrap a component to the entity
   *
   * @param constructor - The constructor of the added component
   * @param component - The component instance to add
   * @returns The entity itself
   */
  private insertComponent(
    constructor: GameComponentConstructor,
    component: GameComponent
  ): this {
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
      set: (target, property, value): boolean => {
        const originalValue = Reflect.get(target, property) as unknown;

        const result = Reflect.set(target, property, value);

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
  public remove<T extends GameComponent>(
    constructor: GameComponentConstructor<T>
  ): this {
    if (this.disposed) {
      throw new Error(
        `Cannot remove component ${constructor.name} from entity ${this.id} because it has been disposed.`
      );
    }

    const component = this.components.get(constructor);
    if (component !== undefined) {
      this.components.delete(constructor);
      component.dispose();
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
  public get<T extends GameComponent>(
    constructor: GameComponentConstructor<T>
  ): T {
    const component = this.components.get(constructor) as T | undefined;
    if (component === undefined) {
      throw new Error(
        `Cannot retrieve component ${constructor.name} from entity ${this.id} because it does not exist.`
      );
    }

    return component;
  }

  /**
   * Check if a given component is mapped to this entity.
   *
   * @param component - The component to check for
   * @returns `true` if the component is mapped to this entity
   */
  public has<T extends GameComponent>(
    component: GameComponentConstructor<T>
  ): boolean {
    return this.components.has(component);
  }

  /**
   * Check if all of the given components are mapped to this entity.
   *
   * @param components - The components to check for
   * @returns `true` if all of the components are mapped to this entity
   */
  public hasAll(components: Iterable<GameComponentConstructor>): boolean {
    for (const additionalComponent of components) {
      if (!this.components.has(additionalComponent)) return false;
    }

    return true;
  }

  /**
   * Check if any of the given components are mapped to this entity.
   *
   * @param components - The components to check for
   * @returns `true` if any of the components are mapped to this entity
   */
  public hasAny(components: Iterable<GameComponentConstructor>): boolean {
    for (const additionalComponent of components) {
      if (this.components.has(additionalComponent)) return true;
    }

    return false;
  }

  /**
   * Get the components that are mapped to this entity.
   *
   * @returns An iterable of all components mapped to this entity
   */
  public getComponents(): Iterable<GameComponentConstructor> {
    return this.components.keys();
  }
}
