import DefaultMap, { ArrayMap, MapMap, SetMap } from "./default-map";

describe("DefaultMap utility", () => {
  it("should provide a default value for missing keys", () => {
    const map = new DefaultMap(() => 0);
    expect(map.get("foo")).toBe(0);
  });

  it("should be able to retrieve existing values", () => {
    const map = new DefaultMap((): number[] => []);
    expect(map.get("foo")).toEqual([]);

    map.get("foo").push(1);
    expect(map.get("foo")).toEqual([1]);
  });

  it("should be able to initialize from initial iterable", () => {
    const map = new DefaultMap(
      () => 0,
      [
        ["foo", 42],
        ["bar", 144],
      ]
    );
    expect(map.get("foo")).toEqual(42);
  });
});

describe("ArrayMap utility", () => {
  it("should provide a default empty array for missing keys", () => {
    const map = new ArrayMap();
    expect(map.get("foo")).toEqual([]);
  });
});

describe("MapMap utility", () => {
  it("should provide a default empty map for missing keys", () => {
    const map = new MapMap();
    expect(map.get("foo")).toEqual(new Map());
  });
});

describe("SetMap utility", () => {
  it("should provide a default empty set for missing keys", () => {
    const map = new SetMap();
    expect(map.get("foo")).toEqual(new Set());
  });
});
