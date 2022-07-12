import { EcsResourceFilterObject } from "./ecs-resource";

import type {
  default as EcsResource,
  EcsResourceConstructor,
} from "./ecs-resource";
import type EcsResourceManager from "./ecs-resource-manager";
import type { ResourceFilterTuple, ResourceInstances } from "./types";
import { SetMap } from "../default-map";

export default class EcsResourceQuery<
  TResourceFilter extends ResourceFilterTuple = []
> {
  public readonly filters: TResourceFilter;
  private readonly manager: EcsResourceManager;

  private readonly operations = new SetMap<string, EcsResourceConstructor>();
  private readonly tracked = new SetMap<string, EcsResourceConstructor>();

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

        this.operations.get(operation).add(resource);
        this.tracked.get(operation).add(resource);
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
    this.tracked.clear();
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

    for (const [operation, resources] of this.operations) {
      if (this.tracked.get(operation).size !== resources.size) {
        return undefined;
      }
    }

    return resourceList as ResourceInstances<TResourceFilter>;
  }

  /**
   * Notifies the query that a resource has changed.
   *
   * @internal
   * @param resource - The resource that changed
   */
  public _onResourceChanged(resource: EcsResourceConstructor): void {
    if (this.operations.get("changed").has(resource)) {
      this.tracked.get("changed").add(resource);
    }
  }
}
