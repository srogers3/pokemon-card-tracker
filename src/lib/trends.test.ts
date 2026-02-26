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
    const result = analyzeTrends([new Date("2026-01-15")]);
    expect(result.grade).toBe("cold");
    expect(result.confidence).toBe("low");
    expect(result.avgDaysBetween).toBeNull();
  });

  it("calculates hot grade for frequent sightings", () => {
    const dates = [
      new Date("2026-01-15"),
      new Date("2026-01-16"),
      new Date("2026-01-17"),
      new Date("2026-01-18"),
    ];
    const result = analyzeTrends(dates);
    expect(result.grade).toBe("hot");
    expect(result.avgDaysBetween).toBe(1);
    expect(result.totalSightings).toBe(4);
    expect(result.confidence).toBe("medium");
  });

  it("calculates warm grade for weekly sightings", () => {
    const dates = [
      new Date("2026-01-01"),
      new Date("2026-01-08"),
      new Date("2026-01-15"),
      new Date("2026-01-22"),
      new Date("2026-01-29"),
    ];
    const result = analyzeTrends(dates);
    expect(result.grade).toBe("warm");
    expect(result.avgDaysBetween).toBe(7);
    expect(result.confidence).toBe("high");
  });

  it("calculates cool grade for bi-weekly sightings", () => {
    const dates = [
      new Date("2026-01-01"),
      new Date("2026-01-15"),
      new Date("2026-01-29"),
    ];
    const result = analyzeTrends(dates);
    expect(result.grade).toBe("cool");
    expect(result.avgDaysBetween).toBe(14);
  });

  it("calculates cold grade for infrequent sightings", () => {
    const dates = [
      new Date("2026-01-01"),
      new Date("2026-02-01"),
      new Date("2026-03-01"),
    ];
    const result = analyzeTrends(dates);
    expect(result.grade).toBe("cold");
  });

  it("finds bestDay when pattern exists", () => {
    const dates = [
      new Date("2026-01-07T10:00:00"),
      new Date("2026-01-14T10:00:00"),
      new Date("2026-01-21T10:00:00"),
    ];
    const result = analyzeTrends(dates);
    expect(result.bestDay).toBe("Wednesdays");
  });

  it("returns null bestDay when no day has 2+ sightings", () => {
    const dates = [
      new Date("2026-01-05T10:00:00"),
      new Date("2026-01-07T10:00:00"),
    ];
    const result = analyzeTrends(dates);
    expect(result.bestDay).toBeNull();
  });

  it("finds bestTimeWindow when 5+ sightings with pattern", () => {
    const dates = [
      new Date("2026-01-01T08:00:00"),
      new Date("2026-01-02T09:00:00"),
      new Date("2026-01-03T10:00:00"),
      new Date("2026-01-04T11:00:00"),
      new Date("2026-01-05T07:00:00"),
    ];
    const result = analyzeTrends(dates);
    expect(result.bestTimeWindow).toBe("morning");
  });

  it("returns null bestTimeWindow with fewer than 5 sightings", () => {
    const dates = [
      new Date("2026-01-01T08:00:00"),
      new Date("2026-01-02T09:00:00"),
      new Date("2026-01-03T10:00:00"),
    ];
    const result = analyzeTrends(dates);
    expect(result.bestTimeWindow).toBeNull();
  });

  it("handles unsorted input dates", () => {
    const dates = [
      new Date("2026-01-18"),
      new Date("2026-01-15"),
      new Date("2026-01-17"),
      new Date("2026-01-16"),
    ];
    const result = analyzeTrends(dates);
    expect(result.avgDaysBetween).toBe(1);
    expect(result.grade).toBe("hot");
  });

  it("sets confidence based on count", () => {
    const two = analyzeTrends([new Date("2026-01-01"), new Date("2026-01-02")]);
    expect(two.confidence).toBe("low");

    const three = analyzeTrends([
      new Date("2026-01-01"),
      new Date("2026-01-02"),
      new Date("2026-01-03"),
    ]);
    expect(three.confidence).toBe("medium");

    const five = analyzeTrends([
      new Date("2026-01-01"),
      new Date("2026-01-02"),
      new Date("2026-01-03"),
      new Date("2026-01-04"),
      new Date("2026-01-05"),
    ]);
    expect(five.confidence).toBe("high");
  });
});
