/**
 * Audit sprites to detect which are "sprite sheets" (bad) vs "single creature" (good).
 *
 * Detection heuristics:
 * 1. Text detection: sprites with text/labels are likely sheets
 * 2. Multiple blobs: sprite sheets have multiple disconnected content regions
 * 3. Grid patterns: sprite sheets often have visible grid lines
 * 4. Background uniformity: good sprites have uniform transparent/simple bg
 *
 * Usage:
 *   npx tsx scripts/audit-sprites.ts
 */

import fs from "fs";
import path from "path";
import sharp from "sharp";

const SPRITES_DIR = path.join(process.cwd(), "public", "sprites");

interface AuditResult {
  id: number;
  filename: string;
  quality: "good" | "questionable" | "bad";
  issues: string[];
  bgTransparency: number; // % of pixels that are transparent
  contentBlobs: number; // estimated number of separate content regions
}

async function auditSprite(filepath: string): Promise<AuditResult> {
  const filename = path.basename(filepath);
  const id = parseInt(filename.split(".")[0].split("-")[0]);
  const issues: string[] = [];

  const image = sharp(filepath);
  const metadata = await image.metadata();
  const { width = 0, height = 0 } = metadata;

  const rawData = await image.ensureAlpha().raw().toBuffer();
  const totalPixels = width * height;

  // 1. Check transparency percentage
  let transparentPixels = 0;
  for (let i = 0; i < totalPixels; i++) {
    if (rawData[i * 4 + 3] < 20) transparentPixels++;
  }
  const bgTransparency = (transparentPixels / totalPixels) * 100;

  if (bgTransparency < 10) {
    issues.push("no-transparency");
  } else if (bgTransparency < 25) {
    issues.push("low-transparency");
  }

  // 2. Check for multiple content blobs using a simplified approach:
  // Divide image into a grid and count how many grid cells have content
  const gridSize = 8;
  const cellW = Math.floor(width / gridSize);
  const cellH = Math.floor(height / gridSize);
  let contentCells = 0;
  const cellHasContent: boolean[][] = [];

  for (let gy = 0; gy < gridSize; gy++) {
    cellHasContent[gy] = [];
    for (let gx = 0; gx < gridSize; gx++) {
      let opaqueCount = 0;
      const startX = gx * cellW;
      const startY = gy * cellH;
      for (let y = startY; y < startY + cellH; y += 2) {
        for (let x = startX; x < startX + cellW; x += 2) {
          const idx = (y * width + x) * 4;
          if (rawData[idx + 3] > 128) opaqueCount++;
        }
      }
      const fillRatio = opaqueCount / ((cellW / 2) * (cellH / 2));
      cellHasContent[gy][gx] = fillRatio > 0.15;
      if (fillRatio > 0.15) contentCells++;
    }
  }

  // Check if content is scattered (sprite sheet) vs concentrated (single sprite)
  // A good sprite has content concentrated in the center
  const centerContent = [3, 4].flatMap(y => [3, 4].map(x => cellHasContent[y]?.[x])).filter(Boolean).length;
  const edgeContent = [0, 1, 6, 7].flatMap(y =>
    [0, 1, 6, 7].map(x => cellHasContent[y]?.[x])
  ).filter(Boolean).length;

  // Estimate number of separate content blobs
  // Simple: count connected groups in the grid
  const visited = Array.from({ length: gridSize }, () => new Array(gridSize).fill(false));
  let contentBlobs = 0;

  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      if (cellHasContent[y][x] && !visited[y][x]) {
        contentBlobs++;
        // Flood fill
        const stack = [{ x, y }];
        while (stack.length > 0) {
          const { x: cx, y: cy } = stack.pop()!;
          if (cx < 0 || cx >= gridSize || cy < 0 || cy >= gridSize) continue;
          if (visited[cy][cx] || !cellHasContent[cy][cx]) continue;
          visited[cy][cx] = true;
          stack.push({ x: cx - 1, y: cy }, { x: cx + 1, y: cy }, { x: cx, y: cy - 1 }, { x: cx, y: cy + 1 });
        }
      }
    }
  }

  if (contentBlobs > 2) {
    issues.push(`multiple-blobs(${contentBlobs})`);
  }

  if (edgeContent > 8) {
    issues.push("edge-heavy");
  }

  // 3. Check for horizontal/vertical lines (grid indicators)
  // Sample rows/columns looking for uniform-color lines
  let gridLineCount = 0;
  for (let y = Math.floor(height * 0.2); y < height * 0.8; y += Math.floor(height / 20)) {
    let sameColorCount = 0;
    const refIdx = (y * width + Math.floor(width * 0.1)) * 4;
    const refR = rawData[refIdx], refG = rawData[refIdx + 1], refB = rawData[refIdx + 2];

    for (let x = Math.floor(width * 0.1); x < width * 0.9; x += 3) {
      const idx = (y * width + x) * 4;
      const dist = Math.sqrt(
        (rawData[idx] - refR) ** 2 + (rawData[idx + 1] - refG) ** 2 + (rawData[idx + 2] - refB) ** 2
      );
      if (dist < 15) sameColorCount++;
    }
    const uniformity = sameColorCount / (width * 0.8 / 3);
    if (uniformity > 0.85) gridLineCount++;
  }

  if (gridLineCount > 3) {
    issues.push("grid-lines");
  }

  // 4. Check if the image looks like a "sheet" — content fills too much of the frame
  const contentFillRatio = contentCells / (gridSize * gridSize);
  if (contentFillRatio > 0.85) {
    issues.push("overfilled");
  }

  // Classify quality
  let quality: "good" | "questionable" | "bad" = "good";
  if (issues.includes("no-transparency") || issues.includes("multiple-blobs(" + contentBlobs + ")") && contentBlobs > 3) {
    quality = "bad";
  } else if (issues.includes("grid-lines") || issues.includes("overfilled")) {
    quality = "bad";
  } else if (issues.length > 0) {
    quality = "questionable";
  }

  return { id, filename, quality, issues, bgTransparency: Math.round(bgTransparency * 10) / 10, contentBlobs };
}

async function main() {
  const files = fs.readdirSync(SPRITES_DIR)
    .filter((f) => f.endsWith(".png") && !f.startsWith("_") && !f.includes("-shiny"))
    .sort((a, b) => parseInt(a) - parseInt(b));

  console.log(`Auditing ${files.length} sprites...\n`);

  const results: AuditResult[] = [];
  for (const file of files) {
    const result = await auditSprite(path.join(SPRITES_DIR, file));
    results.push(result);
  }

  // Summary
  const good = results.filter(r => r.quality === "good");
  const questionable = results.filter(r => r.quality === "questionable");
  const bad = results.filter(r => r.quality === "bad");

  console.log("=== AUDIT RESULTS ===\n");
  console.log(`✅ Good: ${good.length}`);
  if (good.length > 0) {
    console.log(`   IDs: ${good.map(r => r.id).join(", ")}`);
  }

  console.log(`\n⚠️  Questionable: ${questionable.length}`);
  for (const r of questionable) {
    console.log(`   #${r.id} ${r.filename}: ${r.issues.join(", ")} (${r.bgTransparency}% transparent)`);
  }

  console.log(`\n❌ Bad: ${bad.length}`);
  for (const r of bad) {
    console.log(`   #${r.id} ${r.filename}: ${r.issues.join(", ")} (${r.bgTransparency}% transparent)`);
  }

  // Output regeneration command
  const regenIds = [...questionable, ...bad].map(r => r.id);
  if (regenIds.length > 0) {
    console.log(`\n📋 Regeneration command:`);
    console.log(`   npx tsx scripts/generate-sprites.ts --only ${regenIds.join(",")}`);
  }
}

main().catch(console.error);
