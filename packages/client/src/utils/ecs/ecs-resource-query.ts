import { EcsResourceFilterObject } from "./ecs-resource";

import type EcsResource from "./ecs-resource";
import type EcsResourceManager from "./ecs-resource-manager";
import type { ResourceFilterTuple, ResourceInstances } from "./types";

export default class EcsResourceQuery<
  TResourceFilter extends ResourceFilterTuple = []
> {
  public readonly filters: TResourceFilter;
  private readonly manager: EcsResourceManager;

  private readonly onDispose: (
    query: EcsResourceQuery<TResourceFilter>
  ) => void;

  public constructor(
    filters: TResourceFilter,
    manager: EcsResourceManager,
    onDispose: (query: EcsResourceQuery<TResourceFilter>) => void
  ) {
    this.filters = filters;
    this.manager = manager;
    this.onDispose = onDispose;
  }

  /**
   * Dispose the query.
   */
  public dispose(): void {
    this.onDispose(this);
  }

  /**
   * Update the query.
   */
  public update(): void {
    // TODO
  }

  /**
   * Get resources that match the query.
   */
  public getResources(): ResourceInstances<TResourceFilter> | undefined {
    const resourceList: EcsResource[] = [];
    for (const constructor of this.filters) {
      if (constructor instanceof EcsResourceFilterObject) {
        continue;
      }

      if (!this.manager.has(constructor)) {
        return undefined;
      }

      resourceList.push(this.manager.get(constructor));
    }

    return resourceList as ResourceInstances<TResourceFilter>;
  }
}
