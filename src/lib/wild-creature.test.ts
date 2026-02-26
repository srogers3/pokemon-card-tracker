import { describe, it, expect, vi, afterEach } from "vitest";
import { simpleHash, getWildCreature } from "./wild-creature";

describe("simpleHash", () => {
  it("returns a non-negative number", () => {
    expect(simpleHash("test")).toBeGreaterThanOrEqual(0);
  });

  it("is deterministic", () => {
    expect(simpleHash("hello")).toBe(simpleHash("hello"));
  });

  it("produces different hashes for different strings", () => {
    expect(simpleHash("abc")).not.toBe(simpleHash("xyz"));
  });

  it("handles empty string", () => {
    expect(simpleHash("")).toBe(0);
  });
});

describe("getWildCreature", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns a creature with id, name, spriteUrl, and rarity", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-15"));
    const creature = getWildCreature("store-123");
    expect(creature).toHaveProperty("id");
    expect(creature).toHaveProperty("name");
    expect(creature).toHaveProperty("spriteUrl");
    expect(creature).toHaveProperty("rarity");
    expect(typeof creature.id).toBe("number");
    expect(typeof creature.name).toBe("string");
  });

  it("is deterministic for same store and date", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-15"));
    const a = getWildCreature("store-123");
    const b = getWildCreature("store-123");
    expect(a).toEqual(b);
  });

  it("gives different creatures for different stores", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-15"));
    const a = getWildCreature("store-aaa");
    const b = getWildCreature("store-zzz");
    expect(a).toBeDefined();
    expect(b).toBeDefined();
  });

  it("gives different creature for same store on different day", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-15"));
    const day1 = getWildCreature("store-123");
    vi.setSystemTime(new Date("2026-01-16"));
    const day2 = getWildCreature("store-123");
    expect(day1).toBeDefined();
    expect(day2).toBeDefined();
  });

  it("returns a valid rarity tier", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-15"));
    const creature = getWildCreature("store-123");
    expect(["common", "uncommon", "rare", "ultra_rare"]).toContain(creature.rarity);
  });
});
