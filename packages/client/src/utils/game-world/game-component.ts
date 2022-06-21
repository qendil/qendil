/**
 * A reference to a component by its constructor.
 */
export type GameComponentConstructor<T extends GameComponent = GameComponent> =
  new (...args: any) => T;

/**
 * A class that allows for filtering by a component.
 */
export class GameComponentFilterObject<
  T extends GameComponent = GameComponent
> {
  public readonly operation: "added" | "changed" | "less";
  public readonly component: GameComponentConstructor<T>;

  public constructor(
    operation: "added" | "changed" | "less",
    component: GameComponentConstructor<T>
  ) {
    this.operation = operation;
    this.component = component;
  }
}

/**
 * A representation of a component filter.
 */
export type GameComponentFilter<T extends GameComponent = GameComponent> =
  | GameComponentConstructor<T>
  | GameComponentFilterObject<T>;

/**
 * A tool for controlling behavior in an ECS application.
 *
 * It's used to add data to entities, and to query for entities that have
 *  the given components, to then apply component-specific logic to them.
 */
export default class GameComponent {
  /**
   * Create a filter that excludes the given component from the query.
   *
   * @returns A component filter
   */
  public static less(): GameComponentFilterObject {
    return new GameComponentFilterObject(
      "less",
      this as unknown as GameComponentConstructor
    );
  }

  /**
   * Create a filter that only allows entities that have had the component
   *  mapped to them since the last system run.
   *
   * @returns A component filter
   */
  public static added(): GameComponentFilterObject {
    return new GameComponentFilterObject(
      "added",
      this as unknown as GameComponentConstructor
    );
  }

  /**
   * Create a filter that only allows entities that have had the component
   *  value changed since the last system run.
   *
   * @returns A component filter
   */
  public static changed(): GameComponentFilterObject {
    return new GameComponentFilterObject(
      "changed",
      this as unknown as GameComponentConstructor
    );
  }
}
