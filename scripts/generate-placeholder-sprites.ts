// Simple script to create placeholder SVG sprites for all 151 creatures
// Run: npx tsx scripts/generate-placeholder-sprites.ts

import fs from "fs";
import path from "path";
import { CREATURE_DATA } from "../src/db/creature-data";

const TYPE_COLORS: Record<string, string> = {
  starter: "#6366f1",
  shelf: "#f59e0b",
  logistics: "#3b82f6",
  checkout: "#10b981",
  scalper: "#ef4444",
  hype: "#ec4899",
  clearance: "#f97316",
  backroom: "#6b7280",
  corporate: "#8b5cf6",
};

const outDir = path.join(process.cwd(), "public", "sprites");
fs.mkdirSync(outDir, { recursive: true });

for (const creature of CREATURE_DATA) {
  const color = TYPE_COLORS[creature.type] || "#888";
  const initials = creature.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
  <rect width="96" height="96" rx="8" fill="${color}" opacity="0.2"/>
  <rect x="4" y="4" width="88" height="88" rx="6" fill="${color}" opacity="0.1" stroke="${color}" stroke-width="2" stroke-dasharray="4 2"/>
  <text x="48" y="40" text-anchor="middle" font-family="monospace" font-size="10" fill="${color}">#${creature.id}</text>
  <text x="48" y="60" text-anchor="middle" font-family="monospace" font-size="20" font-weight="bold" fill="${color}">${initials}</text>
  <text x="48" y="80" text-anchor="middle" font-family="monospace" font-size="8" fill="${color}" opacity="0.7">${creature.type}</text>
</svg>`;

  fs.writeFileSync(path.join(outDir, `${creature.id}.svg`), svg);

  const shinySvg = svg.replaceAll(color, "#ffd700");
  fs.writeFileSync(path.join(outDir, `${creature.id}-shiny.svg`), shinySvg);
}

console.log(`Generated ${CREATURE_DATA.length * 2} placeholder sprites in public/sprites/`);
