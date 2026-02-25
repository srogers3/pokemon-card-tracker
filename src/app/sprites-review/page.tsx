import fs from "fs";
import path from "path";
import { CREATURE_DATA, TOTAL_CREATURES } from "@/db/creature-data";

const TYPE_COLORS: Record<string, string> = {
  shelf: "#f59e0b",
  logistics: "#3b82f6",
  checkout: "#10b981",
  scalper: "#ef4444",
  hype: "#ec4899",
  clearance: "#f97316",
  backroom: "#6b7280",
  corporate: "#8b5cf6",
};

export default function SpritesReviewPage() {
  // Check which PNGs exist on disk
  const spritesDir = path.join(process.cwd(), "public", "sprites");
  const existingFiles = new Set(
    fs.existsSync(spritesDir) ? fs.readdirSync(spritesDir) : []
  );

  const creatures = CREATURE_DATA.map((c) => ({
    ...c,
    hasPng: existingFiles.has(`${c.id}.png`),
    hasShinyPng: existingFiles.has(`${c.id}-shiny.png`),
    hasSvg: existingFiles.has(`${c.id}.svg`),
  }));

  const totalPng = creatures.filter((c) => c.hasPng).length;
  const totalShiny = creatures.filter((c) => c.hasShinyPng).length;

  // Group by type
  const byType = creatures.reduce(
    (acc, c) => {
      if (!acc[c.type]) acc[c.type] = [];
      acc[c.type].push(c);
      return acc;
    },
    {} as Record<string, typeof creatures>
  );

  const typeOrder = [
    "shelf",
    "logistics",
    "checkout",
    "scalper",
    "hype",
    "clearance",
    "backroom",
    "corporate",
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Sprite Review Gallery</h1>
        <p className="text-gray-400 mb-6">
          {totalPng}/{TOTAL_CREATURES} normal sprites generated &bull; {totalShiny}/{TOTAL_CREATURES} shiny
          sprites &bull;{" "}
          <span className="text-green-400">
            {creatures.filter((c) => c.hasPng).length} ready
          </span>{" "}
          &bull;{" "}
          <span className="text-yellow-400">
            {creatures.filter((c) => !c.hasPng).length} pending
          </span>
        </p>

        {typeOrder.map((type) => {
          const group = byType[type] || [];
          const color = TYPE_COLORS[type];
          return (
            <div key={type} className="mb-10">
              <h2
                className="text-xl font-semibold mb-3 capitalize flex items-center gap-2"
                style={{ color }}
              >
                <span
                  className="w-3 h-3 rounded-full inline-block"
                  style={{ backgroundColor: color }}
                />
                {type} Type
                <span className="text-sm text-gray-500 font-normal">
                  ({group.filter((c) => c.hasPng).length}/{group.length}{" "}
                  generated)
                </span>
              </h2>
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
                {group.map((c) => {
                  const src = c.hasPng
                    ? `/sprites/${c.id}.png`
                    : `/sprites/${c.id}.svg`;
                  return (
                    <div
                      key={c.id}
                      className={`relative rounded-lg p-2 flex flex-col items-center ${
                        c.hasPng
                          ? "bg-gray-800 border border-gray-700"
                          : "bg-gray-900 border border-gray-800 opacity-60"
                      }`}
                    >
                      {/* Status badge */}
                      <div className="absolute top-1 right-1">
                        {c.hasPng ? (
                          <span className="text-green-400 text-xs">✓</span>
                        ) : (
                          <span className="text-yellow-400 text-xs">…</span>
                        )}
                      </div>

                      {/* Sprite */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={src}
                        alt={c.name}
                        className="w-16 h-16 object-contain"
                        style={{ imageRendering: c.hasPng ? "auto" : "auto" }}
                      />

                      {/* Info */}
                      <span className="text-xs text-gray-400 mt-1">
                        #{c.id}
                      </span>
                      <span className="text-xs font-medium text-center leading-tight">
                        {c.name}
                      </span>
                      <span
                        className="text-[10px] mt-0.5"
                        style={{ color }}
                      >
                        {c.rarityTier.replace("_", " ")}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Failures section */}
        <div className="mt-10 border-t border-gray-800 pt-6">
          <h2 className="text-xl font-semibold mb-3 text-red-400">
            Missing Sprites
          </h2>
          <p className="text-gray-400 text-sm mb-3">
            These creatures don&apos;t have PNG sprites yet. Re-run with:{" "}
            <code className="bg-gray-800 px-2 py-0.5 rounded">
              npx tsx scripts/generate-sprites.ts --only{" "}
              {creatures
                .filter((c) => !c.hasPng)
                .map((c) => c.id)
                .join(",")}
            </code>
          </p>
          <div className="flex flex-wrap gap-2">
            {creatures
              .filter((c) => !c.hasPng)
              .map((c) => (
                <span
                  key={c.id}
                  className="bg-gray-800 text-gray-300 text-xs px-2 py-1 rounded"
                >
                  #{c.id} {c.name}
                </span>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
