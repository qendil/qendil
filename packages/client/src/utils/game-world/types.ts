import type {
  GameComponentConstructor,
  GameComponentFilter,
} from "./game-component";

// eslint-disable-next-line @typescript-eslint/ban-types
type TupleType = {} | [unknown];

export type ComponentFilterTuple = GameComponentFilter[] & TupleType;

export type ComponentTuple<T extends GameComponentFilter[]> = T extends []
  ? []
  : T extends [infer H, ...infer R extends GameComponentFilter[]]
  ? H extends GameComponentConstructor
    ? [H, ...ComponentTuple<R>]
    : ComponentTuple<R>
  : never;

export type ComponentInstances<T extends GameComponentFilter[]> = T extends []
  ? []
  : T extends [infer H, ...infer R extends GameComponentFilter[]]
  ? H extends GameComponentConstructor
    ? [InstanceType<H>, ...ComponentInstances<R>]
    : ComponentInstances<R>
  : never;
