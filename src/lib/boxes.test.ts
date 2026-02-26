import { describe, it, expect, vi, afterEach } from "vitest";
import { getCardboardexCompletion, rollUpgradeTier } from "./boxes";

describe("getCardboardexCompletion", () => {
  it("returns 0 for empty array", () => {
    expect(getCardboardexCompletion([])).toBe(0);
  });

  it("returns 0 when all creatureIds are null", () => {
    expect(getCardboardexCompletion([{ creatureId: null }, { creatureId: null }])).toBe(0);
  });

  it("counts unique non-null creatureIds", () => {
    const boxes = [
      { creatureId: 1 },
      { creatureId: 2 },
      { creatureId: 1 },
      { creatureId: 3 },
      { creatureId: null },
    ];
    expect(getCardboardexCompletion(boxes)).toBe(3);
  });

  it("handles single creature", () => {
    expect(getCardboardexCompletion([{ creatureId: 42 }])).toBe(1);
  });
});

describe("rollUpgradeTier", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns the only eligible tier when one option", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    expect(rollUpgradeTier(["ultra_rare"])).toBe("ultra_rare");
  });

  it("respects weighted distribution", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.0);
    expect(rollUpgradeTier(["uncommon", "rare", "ultra_rare"])).toBe("uncommon");

    vi.spyOn(Math, "random").mockReturnValue(0.7);
    expect(rollUpgradeTier(["uncommon", "rare", "ultra_rare"])).toBe("rare");

    vi.spyOn(Math, "random").mockReturnValue(0.95);
    expect(rollUpgradeTier(["uncommon", "rare", "ultra_rare"])).toBe("ultra_rare");
  });
});
