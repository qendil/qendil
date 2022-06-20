import type { GameEntity } from "./game-world";

export class EntityQuery {
  private readonly entities: Set<GameEntity>;
  private readonly onDispose: () => void;

  public constructor(entities: Set<GameEntity>, onDispose: () => void) {
    this.entities = entities;
    this.onDispose = onDispose;
  }

  public dispose(): void {
    this.onDispose();
  }

  public *[Symbol.iterator](): IterableIterator<GameEntity> {
    yield* this.entities;
  }

  public has(entity: GameEntity): boolean {
    return this.entities.has(entity);
  }

  public get size(): number {
    return this.entities.size;
  }
}
