import { EcsResourceFilterObject } from "./ecs-resource";

import type {
  default as EcsResource,
  EcsResourceConstructor,
} from "./ecs-resource";
import type EcsResourceManager from "./ecs-resource-manager";
import type { ResourceFilterTuple, ResourceInstances } from "./types";

export default class EcsResourceQuery<
  TResourceFilter extends ResourceFilterTuple = []
> {
  public readonly filters: TResourceFilter;
  private readonly manager: EcsResourceManager;

  private readonly resourcesToChange = new Set<EcsResourceConstructor>();
  private readonly changedResources = new Set<EcsResourceConstructor>();

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

    for (const constructor of this.filters) {
      if (constructor instanceof EcsResourceFilterObject) {
        const { operation, resource } = constructor;

        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (operation === "changed") {
          this.resourcesToChange.add(resource);
          this.changedResources.add(resource);
        }
      }
    }
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
    this.changedResources.clear();
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

    if (this.changedResources.size !== this.resourcesToChange.size) {
      return undefined;
    }

    return resourceList as ResourceInstances<TResourceFilter>;
  }

  /**
   * Notifies the query that a resource has changed.
   *
   * @param resource - The resource that changed
   */
  public _onResourceChanged(resource: EcsResourceConstructor): void {
    if (this.resourcesToChange.has(resource)) {
      this.changedResources.add(resource);
    }
  }
}
