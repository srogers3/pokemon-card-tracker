import { describe, it, expect } from "vitest";
import { isLikelyRetailStore, mapStoreType, toGridCell } from "./places-utils";

describe("isLikelyRetailStore", () => {
  it("returns true for retail types", () => {
    expect(isLikelyRetailStore(["store", "point_of_interest"])).toBe(true);
  });

  it("returns true for empty types array", () => {
    expect(isLikelyRetailStore([])).toBe(true);
  });

  it("returns false when any type is excluded", () => {
    expect(isLikelyRetailStore(["store", "restaurant"])).toBe(false);
    expect(isLikelyRetailStore(["church"])).toBe(false);
    expect(isLikelyRetailStore(["hospital", "point_of_interest"])).toBe(false);
  });

  it("returns false for various excluded categories", () => {
    expect(isLikelyRetailStore(["school"])).toBe(false);
    expect(isLikelyRetailStore(["bank"])).toBe(false);
    expect(isLikelyRetailStore(["gym"])).toBe(false);
    expect(isLikelyRetailStore(["car_dealer"])).toBe(false);
    expect(isLikelyRetailStore(["night_club"])).toBe(false);
  });
});

describe("mapStoreType", () => {
  it('maps department_store to "big_box"', () => {
    expect(mapStoreType(["department_store"])).toBe("big_box");
  });

  it('maps shopping_mall to "big_box"', () => {
    expect(mapStoreType(["shopping_mall"])).toBe("big_box");
  });

  it('maps grocery_or_supermarket to "grocery"', () => {
    expect(mapStoreType(["grocery_or_supermarket"])).toBe("grocery");
  });

  it('maps supermarket to "grocery"', () => {
    expect(mapStoreType(["supermarket"])).toBe("grocery");
  });

  it('maps pharmacy to "pharmacy"', () => {
    expect(mapStoreType(["pharmacy"])).toBe("pharmacy");
  });

  it('maps drugstore to "pharmacy"', () => {
    expect(mapStoreType(["drugstore"])).toBe("pharmacy");
  });

  it('maps store to "lgs"', () => {
    expect(mapStoreType(["store"])).toBe("lgs");
  });

  it('maps book_store to "lgs"', () => {
    expect(mapStoreType(["book_store"])).toBe("lgs");
  });

  it('maps unknown types to "other"', () => {
    expect(mapStoreType(["point_of_interest"])).toBe("other");
    expect(mapStoreType([])).toBe("other");
  });

  it("uses first matching type when multiple present", () => {
    expect(mapStoreType(["store", "department_store"])).toBe("big_box");
  });
});

describe("toGridCell", () => {
  it("rounds to 0.05-degree grid", () => {
    const result = toGridCell(40.712, -74.006);
    expect(result.gridLat).toBeCloseTo(40.7, 5);
    expect(result.gridLng).toBeCloseTo(-74.0, 5);
  });

  it("rounds to nearest grid cell", () => {
    const result = toGridCell(40.726, -74.023);
    expect(result.gridLat).toBeCloseTo(40.75, 5);
    expect(result.gridLng).toBeCloseTo(-74.0, 5);
  });

  it("handles zero coordinates", () => {
    const result = toGridCell(0, 0);
    expect(result.gridLat).toBe(0);
    expect(result.gridLng).toBe(0);
  });

  it("handles negative coordinates", () => {
    const result = toGridCell(-33.868, 151.209);
    expect(result.gridLat).toBeCloseTo(-33.85, 5);
    expect(result.gridLng).toBeCloseTo(151.2, 5);
  });
});
