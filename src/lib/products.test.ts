import { describe, it, expect } from "vitest";
import { groupProductsBySet } from "./products";

describe("groupProductsBySet", () => {
  it("groups products by setName and sorts sets by releaseDate descending", () => {
    const products = [
      { id: "1", name: "Old Set ETB", setName: "Old Set", productType: "etb" as const, releaseDate: new Date("2024-01-01"), imageUrl: null, createdAt: new Date() },
      { id: "2", name: "New Set Booster Box", setName: "New Set", productType: "booster_box" as const, releaseDate: new Date("2025-03-01"), imageUrl: null, createdAt: new Date() },
      { id: "3", name: "New Set ETB", setName: "New Set", productType: "etb" as const, releaseDate: new Date("2025-03-01"), imageUrl: null, createdAt: new Date() },
      { id: "4", name: "Mid Set ETB", setName: "Mid Set", productType: "etb" as const, releaseDate: new Date("2024-06-01"), imageUrl: null, createdAt: new Date() },
    ];

    const result = groupProductsBySet(products);

    expect(result).toHaveLength(3);
    // Newest set first
    expect(result[0].setName).toBe("New Set");
    expect(result[1].setName).toBe("Mid Set");
    expect(result[2].setName).toBe("Old Set");
    // Products within set sorted alphabetically
    expect(result[0].products[0].name).toBe("New Set Booster Box");
    expect(result[0].products[1].name).toBe("New Set ETB");
  });

  it("returns empty array for empty input", () => {
    expect(groupProductsBySet([])).toEqual([]);
  });
});
