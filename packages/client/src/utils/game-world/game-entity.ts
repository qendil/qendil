import type {
  default as GameComponent,
  GameComponentConstructor,
} from "./game-component";

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

export default class GameEntity {
  public readonly id: number;
  private readonly hooks: GameEntityLifecycleHooks;

  private readonly components = new Map<
    GameComponentConstructor,
    GameComponent
  >();

  public constructor(id: number, hooks: GameEntityLifecycleHooks) {
    this.id = id;
    this.hooks = hooks;
  }

  public dispose(): void {
    this.hooks.onDispose(this);
  }

  public insert<T extends GameComponent>(
    constructor: GameComponentConstructor<T>,
    values?: Partial<Record<keyof T, any>>
  ): this {
    if (this.components.has(constructor)) {
      throw new Error(
        `Cannot add component ${constructor.name} to entity ${this.id} because it already exists.`
      );
    }

    const component = new constructor();
    if (values !== undefined) {
      Object.assign(component, values);
    }

    const proxy = new Proxy(component, {
      set: (target, property, value): boolean => {
        const result = Reflect.set(target, property, value);
        this.hooks.onComponentChanged(this, constructor);
        return result;
      },
    });

    this.components.set(constructor, proxy);
    this.hooks.onComponentAdded(this, constructor);

    return this;
  }

  public remove<T extends GameComponent>(
    constructor: GameComponentConstructor<T>
  ): this {
    this.components.delete(constructor);
    this.hooks.onComponentRemoved(this, constructor);

    return this;
  }

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

  public has<T extends GameComponent>(
    component: GameComponentConstructor<T>
  ): boolean {
    return this.components.has(component);
  }

  public hasAll(components: Iterable<GameComponentConstructor>): boolean {
    for (const additionalComponent of components) {
      if (!this.components.has(additionalComponent)) return false;
    }

    return true;
  }

  public hasAny(components: Iterable<GameComponentConstructor>): boolean {
    for (const additionalComponent of components) {
      if (this.components.has(additionalComponent)) return true;
    }

    return false;
  }

  public getComponents(): Iterable<GameComponentConstructor> {
    return this.components.keys();
  }
}
