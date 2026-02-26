export interface RestockTrend {
  grade: "hot" | "warm" | "cool" | "cold";
  avgDaysBetween: number | null;
  totalSightings: number;
  bestDay: string | null;
  bestTimeWindow: string | null;
  confidence: "low" | "medium" | "high";
}

const DAY_NAMES = ["Sundays", "Mondays", "Tuesdays", "Wednesdays", "Thursdays", "Fridays", "Saturdays"];

function getGrade(avgDays: number | null, total: number): "hot" | "warm" | "cool" | "cold" {
  if (total < 3 || avgDays === null) return "cold";
  if (avgDays < 3) return "hot";
  if (avgDays <= 7) return "warm";
  if (avgDays <= 14) return "cool";
  return "cold";
}

function getBarPercent(grade: "hot" | "warm" | "cool" | "cold"): number {
  switch (grade) {
    case "hot": return 90;
    case "warm": return 65;
    case "cool": return 35;
    case "cold": return 15;
  }
}

function getBestDay(dates: Date[]): string | null {
  const dayCounts = new Array(7).fill(0);
  for (const d of dates) {
    dayCounts[d.getDay()]++;
  }
  const maxCount = Math.max(...dayCounts);
  if (maxCount < 2) return null;
  const bestIdx = dayCounts.indexOf(maxCount);
  return DAY_NAMES[bestIdx];
}

function getBestTimeWindow(dates: Date[]): string | null {
  const buckets = { morning: 0, afternoon: 0, evening: 0 };
  for (const d of dates) {
    const h = d.getHours();
    if (h >= 6 && h < 12) buckets.morning++;
    else if (h >= 12 && h < 17) buckets.afternoon++;
    else if (h >= 17 && h < 21) buckets.evening++;
  }
  const entries = Object.entries(buckets) as [string, number][];
  entries.sort((a, b) => b[1] - a[1]);
  if (entries[0][1] < 3) return null;
  return entries[0][0];
}

export type SightingInput = { date: Date; verified: boolean };

export function analyzeTrends(sightings: SightingInput[]): RestockTrend {
  const total = sightings.length;
  const sightedDates = sightings.map(s => s.date);
  const verifiedCount = sightings.filter(s => s.verified).length;
  const verifiedRatio = total > 0 ? verifiedCount / total : 0;

  if (total < 2) {
    return {
      grade: "cold",
      avgDaysBetween: null,
      totalSightings: total,
      bestDay: null,
      bestTimeWindow: null,
      confidence: "low",
    };
  }

  // Sort chronologically
  const sorted = [...sightedDates].sort((a, b) => a.getTime() - b.getTime());

  // Average days between sightings
  const firstMs = sorted[0].getTime();
  const lastMs = sorted[sorted.length - 1].getTime();
  const spanDays = (lastMs - firstMs) / (1000 * 60 * 60 * 24);
  const avgDays = spanDays / (total - 1);

  const grade = getGrade(avgDays, total);

  const confidence: "low" | "medium" | "high" =
    total < 3 ? "low"
    : verifiedRatio >= 0.6 ? "high"
    : verifiedRatio >= 0.3 ? "medium"
    : "low";

  const bestDay = total >= 3 ? getBestDay(sorted) : null;
  const bestTimeWindow = total >= 5 ? getBestTimeWindow(sorted) : null;

  return {
    grade,
    avgDaysBetween: Math.round(avgDays * 10) / 10,
    totalSightings: total,
    bestDay,
    bestTimeWindow,
    confidence,
  };
}

export { getBarPercent };
