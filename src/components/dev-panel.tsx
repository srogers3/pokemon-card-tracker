"use client";

import { useState, useEffect, useCallback } from "react";

const TOGGLES = [
  { key: "dev_premium", label: "Simulate Premium" },
  { key: "dev_skip_delay", label: "Skip 24h Delay" },
  { key: "dev_force_corroborate", label: "Force Corroboration" },
  { key: "dev_skip_proximity", label: "Skip Proximity Check" },
  { key: "dev_skip_sighting_limits", label: "Skip Sighting Limits" },
] as const;

function getCookie(name: string): boolean {
  return document.cookie.split("; ").some((c) => c === `${name}=true`);
}

function setCookie(name: string, value: boolean) {
  if (value) {
    document.cookie = `${name}=true; path=/; max-age=86400`;
  } else {
    document.cookie = `${name}=; path=/; max-age=0`;
  }
}

export function DevPanel() {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const v: Record<string, boolean> = {};
    for (const t of TOGGLES) {
      v[t.key] = getCookie(t.key);
    }
    setValues(v);
  }, []);

  const toggle = useCallback((key: string) => {
    setValues((prev) => {
      const next = !prev[key];
      setCookie(key, next);
      return { ...prev, [key]: next };
    });
  }, []);

  const activeCount = Object.values(values).filter(Boolean).length;

  return (
    <div className="fixed bottom-4 right-4 z-[200]">
      {open && (
        <div className="mb-2 bg-zinc-900 text-white rounded-lg shadow-xl border border-zinc-700 p-3 w-56">
          <div className="text-xs font-semibold text-zinc-400 mb-2">Dev Overrides</div>
          <div className="space-y-2">
            {TOGGLES.map((t) => (
              <label key={t.key} className="flex items-center gap-3 cursor-pointer text-sm">
                <button
                  onClick={() => toggle(t.key)}
                  className={`shrink-0 w-9 h-5 rounded-full transition-colors relative ${
                    values[t.key] ? "bg-emerald-500" : "bg-zinc-600"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                      values[t.key] ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </button>
                <span className={values[t.key] ? "text-white" : "text-zinc-400"}>
                  {t.label}
                </span>
              </label>
            ))}
          </div>
          <p className="text-[10px] text-zinc-500 mt-2">Changes apply on next server action / page load</p>
        </div>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        className={`w-10 h-10 rounded-full shadow-lg flex items-center justify-center text-lg transition-colors ${
          activeCount > 0
            ? "bg-emerald-600 text-white"
            : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
        }`}
        title="Dev Panel"
      >
        {activeCount > 0 ? activeCount : "\u2699"}
      </button>
    </div>
  );
}
