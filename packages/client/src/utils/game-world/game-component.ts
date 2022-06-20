export type GameComponentConstructor<T extends GameComponent = GameComponent> =
  new (...args: any) => T;

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

export type GameComponentFilter<T extends GameComponent = GameComponent> =
  | GameComponentConstructor<T>
  | GameComponentFilterObject<T>;

export default class GameComponent {
  public static less(): GameComponentFilterObject {
    return new GameComponentFilterObject(
      "less",
      this as unknown as GameComponentConstructor
    );
  }

  public static added(): GameComponentFilterObject {
    return new GameComponentFilterObject(
      "added",
      this as unknown as GameComponentConstructor
    );
  }

  public static changed(): GameComponentFilterObject {
    return new GameComponentFilterObject(
      "changed",
      this as unknown as GameComponentConstructor
    );
  }
}
