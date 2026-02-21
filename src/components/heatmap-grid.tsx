"use client";

import { cn } from "@/lib/utils";

type HeatmapData = {
  dayOfWeek: number;
  hourOfDay: number;
  frequencyCount: number;
}[];

const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const hours = Array.from({ length: 24 }, (_, i) => i);

function getColor(count: number, max: number) {
  if (count === 0) return "bg-muted";
  const intensity = count / max;
  if (intensity < 0.25) return "bg-green-200 dark:bg-green-900";
  if (intensity < 0.5) return "bg-green-400 dark:bg-green-700";
  if (intensity < 0.75) return "bg-green-600 dark:bg-green-500";
  return "bg-green-800 dark:bg-green-300";
}

export function HeatmapGrid({ data }: { data: HeatmapData }) {
  const dataMap = new Map(
    data.map((d) => [`${d.dayOfWeek}-${d.hourOfDay}`, d.frequencyCount])
  );
  const max = Math.max(...data.map((d) => d.frequencyCount), 1);

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[700px]">
        {/* Hour labels */}
        <div className="flex gap-1 mb-1 ml-12">
          {hours.map((h) => (
            <div
              key={h}
              className="w-6 text-xs text-center text-muted-foreground"
            >
              {h % 3 === 0 ? `${h}` : ""}
            </div>
          ))}
        </div>
        {/* Grid rows */}
        {days.map((day, dayIdx) => (
          <div key={day} className="flex items-center gap-1 mb-1">
            <span className="w-10 text-xs text-muted-foreground text-right mr-1">
              {day}
            </span>
            {hours.map((hour) => {
              const count = dataMap.get(`${dayIdx}-${hour}`) ?? 0;
              return (
                <div
                  key={hour}
                  className={cn(
                    "w-6 h-6 rounded-sm",
                    getColor(count, max)
                  )}
                  title={`${day} ${hour}:00 — ${count} sighting${count !== 1 ? "s" : ""}`}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
