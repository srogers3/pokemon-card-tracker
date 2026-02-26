import { describe, it, expect } from "vitest";
import { shouldAutoVerify } from "./trust";

describe("shouldAutoVerify", () => {
  it("returns false for score below 50", () => {
    expect(shouldAutoVerify(0)).toBe(false);
    expect(shouldAutoVerify(49)).toBe(false);
  });

  it("returns true for score of exactly 50", () => {
    expect(shouldAutoVerify(50)).toBe(true);
  });

  it("returns true for score above 50", () => {
    expect(shouldAutoVerify(100)).toBe(true);
  });
});
