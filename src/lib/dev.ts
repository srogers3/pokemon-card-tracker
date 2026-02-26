import { cookies } from "next/headers";

export type DevOverrides = {
  simulatePremium: boolean;
  skipDelay: boolean;
  forceCorroborate: boolean;
  skipProximity: boolean;
};

const DEFAULTS: DevOverrides = {
  simulatePremium: false,
  skipDelay: false,
  forceCorroborate: false,
  skipProximity: false,
};

export async function getDevOverrides(): Promise<DevOverrides> {
  if (process.env.NODE_ENV !== "development") {
    return DEFAULTS;
  }

  const c = await cookies();
  return {
    simulatePremium: c.get("dev_premium")?.value === "true",
    skipDelay: c.get("dev_skip_delay")?.value === "true",
    forceCorroborate: c.get("dev_force_corroborate")?.value === "true",
    skipProximity: c.get("dev_skip_proximity")?.value === "true",
  };
}
