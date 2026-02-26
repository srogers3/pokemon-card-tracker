import { describe, it, expect, vi, afterEach } from "vitest";
import { cn, getDistanceMeters, timeAgo, MAX_TIP_DISTANCE_M } from "./utils";

describe("cn", () => {
  it("merges tailwind classes", () => {
    expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
  });

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", "extra")).toBe("base extra");
  });
});

describe("getDistanceMeters", () => {
  it("returns 0 for identical points", () => {
    expect(getDistanceMeters(40.7128, -74.006, 40.7128, -74.006)).toBe(0);
  });

  it("calculates distance between NYC and LA approximately", () => {
    const dist = getDistanceMeters(40.7128, -74.006, 34.0522, -118.2437);
    expect(dist).toBeGreaterThan(3_900_000);
    expect(dist).toBeLessThan(4_000_000);
  });

  it("calculates short distance accurately", () => {
    const dist = getDistanceMeters(40.0, -74.0, 40.001, -74.0);
    expect(dist).toBeGreaterThan(100);
    expect(dist).toBeLessThan(120);
  });
});

describe("MAX_TIP_DISTANCE_M", () => {
  it("is 800 meters", () => {
    expect(MAX_TIP_DISTANCE_M).toBe(800);
  });
});

describe("timeAgo", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "Just now" for less than 60 seconds ago', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-15T12:00:30Z"));
    expect(timeAgo(new Date("2026-01-15T12:00:00Z"))).toBe("Just now");
  });

  it('returns "Xm ago" for minutes', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-15T12:05:00Z"));
    expect(timeAgo(new Date("2026-01-15T12:00:00Z"))).toBe("5m ago");
  });

  it('returns "Xh ago" for hours', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-15T15:00:00Z"));
    expect(timeAgo(new Date("2026-01-15T12:00:00Z"))).toBe("3h ago");
  });

  it('returns "Yesterday" for 1 day ago', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-16T12:00:00Z"));
    expect(timeAgo(new Date("2026-01-15T12:00:00Z"))).toBe("Yesterday");
  });

  it('returns "Xd ago" for 2-6 days', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-18T12:00:00Z"));
    expect(timeAgo(new Date("2026-01-15T12:00:00Z"))).toBe("3d ago");
  });

  it("returns locale date string for 7+ days", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-25T12:00:00Z"));
    const result = timeAgo(new Date("2026-01-15T12:00:00Z"));
    expect(result).not.toContain("ago");
    expect(result).not.toBe("Yesterday");
  });
});
