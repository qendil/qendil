/**
 * A reference to a resource by its constructor.
 */
export type EcsResourceConstructor<
  T extends EcsResource = EcsResource,
  TArgs extends any[] = any
> = new (...args: TArgs) => T;

/**
 * A global, unique component accessible from anywhere.
 */
export default class EcsResource {
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
