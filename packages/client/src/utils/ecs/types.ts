import type {
  EcsComponentConstructor,
  EcsComponentFilter,
} from "./ecs-component";

// eslint-disable-next-line @typescript-eslint/ban-types
type TupleType = {} | [unknown];

export type ComponentFilterTuple = EcsComponentFilter[] & TupleType;

export type ComponentTuple<T extends EcsComponentFilter[]> = T extends []
  ? []
  : T extends [infer H, ...infer R extends EcsComponentFilter[]]
  ? H extends EcsComponentConstructor
    ? [H, ...ComponentTuple<R>]
    : ComponentTuple<R>
  : never;

export type ComponentInstances<T extends EcsComponentFilter[]> = T extends []
  ? []
  : T extends [infer H, ...infer R extends EcsComponentFilter[]]
  ? H extends EcsComponentConstructor
    ? [InstanceType<H>, ...ComponentInstances<R>]
    : ComponentInstances<R>
  : never;
