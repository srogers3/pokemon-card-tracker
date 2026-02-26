import { describe, it, expect } from "vitest";
import { analyzeTrends, getBarPercent } from "./trends";

describe("getBarPercent", () => {
  it("returns 90 for hot", () => expect(getBarPercent("hot")).toBe(90));
  it("returns 65 for warm", () => expect(getBarPercent("warm")).toBe(65));
  it("returns 35 for cool", () => expect(getBarPercent("cool")).toBe(35));
  it("returns 15 for cold", () => expect(getBarPercent("cold")).toBe(15));
});

describe("analyzeTrends", () => {
  it("returns cold with low confidence for empty input", () => {
    const result = analyzeTrends([]);
    expect(result).toEqual({
      grade: "cold",
      avgDaysBetween: null,
      totalSightings: 0,
      bestDay: null,
      bestTimeWindow: null,
      confidence: "low",
    });
  });

  it("returns cold with low confidence for single date", () => {
    const result = analyzeTrends([{ date: new Date("2026-01-15"), verified: true }]);
    expect(result.grade).toBe("cold");
    expect(result.confidence).toBe("low");
    expect(result.avgDaysBetween).toBeNull();
  });

  it("calculates hot grade for frequent sightings", () => {
    const sightings = [
      { date: new Date("2026-01-15"), verified: true },
      { date: new Date("2026-01-16"), verified: true },
      { date: new Date("2026-01-17"), verified: true },
      { date: new Date("2026-01-18"), verified: true },
    ];
    const result = analyzeTrends(sightings);
    expect(result.grade).toBe("hot");
    expect(result.avgDaysBetween).toBe(1);
    expect(result.totalSightings).toBe(4);
    expect(result.confidence).toBe("high");
  });

  it("calculates warm grade for weekly sightings", () => {
    const sightings = [
      { date: new Date("2026-01-01"), verified: true },
      { date: new Date("2026-01-08"), verified: true },
      { date: new Date("2026-01-15"), verified: true },
      { date: new Date("2026-01-22"), verified: true },
      { date: new Date("2026-01-29"), verified: true },
    ];
    const result = analyzeTrends(sightings);
    expect(result.grade).toBe("warm");
    expect(result.avgDaysBetween).toBe(7);
    expect(result.confidence).toBe("high");
  });

  it("calculates cool grade for bi-weekly sightings", () => {
    const sightings = [
      { date: new Date("2026-01-01"), verified: true },
      { date: new Date("2026-01-15"), verified: true },
      { date: new Date("2026-01-29"), verified: true },
    ];
    const result = analyzeTrends(sightings);
    expect(result.grade).toBe("cool");
    expect(result.avgDaysBetween).toBe(14);
  });

  it("calculates cold grade for infrequent sightings", () => {
    const sightings = [
      { date: new Date("2026-01-01"), verified: true },
      { date: new Date("2026-02-01"), verified: true },
      { date: new Date("2026-03-01"), verified: true },
    ];
    const result = analyzeTrends(sightings);
    expect(result.grade).toBe("cold");
  });

  it("finds bestDay when pattern exists", () => {
    const sightings = [
      { date: new Date("2026-01-07T10:00:00"), verified: true },
      { date: new Date("2026-01-14T10:00:00"), verified: true },
      { date: new Date("2026-01-21T10:00:00"), verified: true },
    ];
    const result = analyzeTrends(sightings);
    expect(result.bestDay).toBe("Wednesdays");
  });

  it("returns null bestDay when no day has 2+ sightings", () => {
    const sightings = [
      { date: new Date("2026-01-05T10:00:00"), verified: true },
      { date: new Date("2026-01-07T10:00:00"), verified: true },
    ];
    const result = analyzeTrends(sightings);
    expect(result.bestDay).toBeNull();
  });

  it("finds bestTimeWindow when 5+ sightings with pattern", () => {
    const sightings = [
      { date: new Date("2026-01-01T08:00:00"), verified: true },
      { date: new Date("2026-01-02T09:00:00"), verified: true },
      { date: new Date("2026-01-03T10:00:00"), verified: true },
      { date: new Date("2026-01-04T11:00:00"), verified: true },
      { date: new Date("2026-01-05T07:00:00"), verified: true },
    ];
    const result = analyzeTrends(sightings);
    expect(result.bestTimeWindow).toBe("morning");
  });

  it("returns null bestTimeWindow with fewer than 5 sightings", () => {
    const sightings = [
      { date: new Date("2026-01-01T08:00:00"), verified: true },
      { date: new Date("2026-01-02T09:00:00"), verified: true },
      { date: new Date("2026-01-03T10:00:00"), verified: true },
    ];
    const result = analyzeTrends(sightings);
    expect(result.bestTimeWindow).toBeNull();
  });

  it("handles unsorted input dates", () => {
    const sightings = [
      { date: new Date("2026-01-18"), verified: true },
      { date: new Date("2026-01-15"), verified: true },
      { date: new Date("2026-01-17"), verified: true },
      { date: new Date("2026-01-16"), verified: true },
    ];
    const result = analyzeTrends(sightings);
    expect(result.avgDaysBetween).toBe(1);
    expect(result.grade).toBe("hot");
  });

  it("sets confidence based on verified ratio", () => {
    // fewer than 3 is always low
    const two = analyzeTrends([
      { date: new Date("2026-01-01"), verified: true },
      { date: new Date("2026-01-02"), verified: true },
    ]);
    expect(two.confidence).toBe("low");

    // 3 all verified => high (ratio 1.0 >= 0.6)
    const threeVerified = analyzeTrends([
      { date: new Date("2026-01-01"), verified: true },
      { date: new Date("2026-01-02"), verified: true },
      { date: new Date("2026-01-03"), verified: true },
    ]);
    expect(threeVerified.confidence).toBe("high");

    // 5 all verified => high
    const fiveVerified = analyzeTrends([
      { date: new Date("2026-01-01"), verified: true },
      { date: new Date("2026-01-02"), verified: true },
      { date: new Date("2026-01-03"), verified: true },
      { date: new Date("2026-01-04"), verified: true },
      { date: new Date("2026-01-05"), verified: true },
    ]);
    expect(fiveVerified.confidence).toBe("high");
  });

  it("returns low confidence when most sightings are unverified", () => {
    const sightings = [
      { date: new Date("2026-01-01"), verified: false },
      { date: new Date("2026-01-05"), verified: false },
      { date: new Date("2026-01-10"), verified: false },
      { date: new Date("2026-01-15"), verified: true },
    ];
    const result = analyzeTrends(sightings);
    expect(result.confidence).toBe("low");
  });

  it("returns high confidence when most sightings are verified", () => {
    const sightings = [
      { date: new Date("2026-01-01"), verified: true },
      { date: new Date("2026-01-05"), verified: true },
      { date: new Date("2026-01-10"), verified: true },
      { date: new Date("2026-01-15"), verified: false },
    ];
    const result = analyzeTrends(sightings);
    expect(result.confidence).toBe("high");
  });
});
