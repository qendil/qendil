import type {
  EcsComponentConstructor,
  EcsComponentFilter,
} from "./ecs-component";
import type { EcsResourceConstructor, EcsResourceFilter } from "./ecs-resource";

// eslint-disable-next-line @typescript-eslint/ban-types
type TupleType = {} | [unknown];

/**
 * @internal
 */
export type ComponentFilterTuple = [] | (EcsComponentFilter[] & TupleType);

/**
 * @internal
 */
export type ComponentTuple<T extends EcsComponentFilter[]> = T extends []
  ? []
  : T extends [infer H, ...infer R extends EcsComponentFilter[]]
  ? H extends EcsComponentConstructor
    ? [H, ...ComponentTuple<R>]
    : ComponentTuple<R>
  : never;

/**
 * @internal
 */
export type ComponentInstances<T extends EcsComponentFilter[]> = T extends []
  ? []
  : T extends [infer H, ...infer R extends EcsComponentFilter[]]
  ? H extends EcsComponentConstructor
    ? [InstanceType<H>, ...ComponentInstances<R>]
    : ComponentInstances<R>
  : never;

/**
 * @internal
 */
export type ResourceFilterTuple = [] | (EcsResourceFilter[] & TupleType);

/**
 * @internal
 */
export type ResourceInstances<T extends EcsResourceFilter[]> = T extends []
  ? []
  : T extends [infer H, ...infer R extends EcsResourceFilter[]]
  ? H extends EcsResourceConstructor
    ? [InstanceType<H>, ...ResourceInstances<R>]
    : ResourceInstances<R>
  : never;
