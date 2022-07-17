import type { EcsEntity } from "./ecs-entity";

/**
 * A reference to a component by its constructor.
 *
 * @internal
 */
export type EcsComponentConstructor<
  T extends EcsComponent = EcsComponent,
  TArgs extends any[] = any
> = new (...args: TArgs) => T;

type OperationType = "absent" | "added" | "changed" | "present";

/**
 * A class that allows for filtering by a component.
 *
 * @internal
 */
export class EcsFilterObject<T extends EcsComponent = EcsComponent> {
  public readonly operation: OperationType;
  public readonly component: EcsComponentConstructor<T>;

  public constructor(
    operation: OperationType,
    component: EcsComponentConstructor<T>
  ) {
    this.operation = operation;
    this.component = component;
  }
}

/**
 * A representation of a component filter.
 *
 * @internal
 */
export type EcsComponentFilter<T extends EcsComponent = EcsComponent> =
  | EcsComponentConstructor<T>
  | EcsFilterObject<T>;

/**
 * A tool for controlling behavior in an ECS application.
 *
 * It's used to add data to entities, and to query for entities that have
 *  the given components, to then apply component-specific logic to them.
 */
export default class EcsComponent {
  /**
   * Create a filter that only allows entities that have the component
   */
  public static present(): EcsFilterObject {
    return new EcsFilterObject(
      "present",
      this as unknown as EcsComponentConstructor
    );
  }

  /**
   * Create a filter that excludes the given component from the query.
   *
   * @returns A component filter
   */
  public static absent(): EcsFilterObject {
    return new EcsFilterObject(
      "absent",
      this as unknown as EcsComponentConstructor
    );
  }

  /**
   * Create a filter that only allows entities that have had the component
   *  mapped to them since the last system run.
   *
   * @returns A component filter
   */
  public static added(): EcsFilterObject {
    return new EcsFilterObject(
      "added",
      this as unknown as EcsComponentConstructor
    );
  }

  /**
   * Create a filter that only allows entities that have had the component
   *  value changed since the last system run.
   *
   * @returns A component filter
   */
  public static changed(): EcsFilterObject {
    return new EcsFilterObject(
      "changed",
      this as unknown as EcsComponentConstructor
    );
  }

  /**
   * Disposes and cleans up the component.
   *
   * @important This method is only meant for resource clean up,
   *  avoid running game logic in here.
   */
  public dispose(_entity: EcsEntity): void {
    // Nothing to do
  }
}
