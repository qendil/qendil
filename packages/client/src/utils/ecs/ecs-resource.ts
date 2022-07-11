/**
 * A reference to a resource by its constructor.
 */
export type EcsResourceConstructor<
  T extends EcsResource = EcsResource,
  TArgs extends any[] = any
> = new (...args: TArgs) => T;

type OperationType = "changed";

/**
 * A class that allows for filtering resources
 */
export class EcsResourceFilterObject<T extends EcsResource = EcsResource> {
  public readonly operation: OperationType;
  public readonly resource: EcsResourceConstructor<T>;

  public constructor(
    operation: OperationType,
    resource: EcsResourceConstructor<T>
  ) {
    this.operation = operation;
    this.resource = resource;
  }
}

/**
 * A representation of a resource filter.
 */
export type EcsResourceFilter<T extends EcsResource = EcsResource> =
  | EcsResourceConstructor<T>
  | EcsResourceFilterObject<T>;

/**
 * A global, unique component accessible from anywhere.
 */
export default class EcsResource {
  /**
   * Create a filter that only allows entities that have had the component
   *  value changed since the last system run.
   *
   * @returns A component filter
   */
  public static changed(): EcsResourceFilterObject {
    return new EcsResourceFilterObject(
      "changed",
      this as unknown as EcsResourceConstructor
    );
  }

  /**
   * Disposes and cleans up the resource.
   *
   * @important This method is only meant for resource clean up,
   *  avoid running game logic in here.
   */
  public dispose(): void {
    // Nothing to do
  }
}
