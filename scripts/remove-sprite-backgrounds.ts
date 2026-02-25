/**
 * Remove backgrounds from generated sprites using sharp.
 *
 * DALL-E 3 doesn't truly support transparent backgrounds, so this script
 * post-processes PNG sprites by:
 * 1. Flood-filling from edges using neighbor-similarity (handles gradients)
 * 2. Detecting edges where the creature starts via contrast detection
 * 3. Replacing background pixels with transparency
 * 4. Resizing from 1024x1024 → 96x96 (our target sprite size)
 *
 * Usage:
 *   npx tsx scripts/remove-sprite-backgrounds.ts              # Process all
 *   npx tsx scripts/remove-sprite-backgrounds.ts --only 1,5   # Specific IDs
 *   npx tsx scripts/remove-sprite-backgrounds.ts --threshold 30  # Neighbor similarity (default: 25)
 *   npx tsx scripts/remove-sprite-backgrounds.ts --skip-resize   # Keep 1024x1024 for review
 */

import fs from "fs";
import path from "path";
import sharp from "sharp";

const SPRITES_DIR = path.join(process.cwd(), "public", "sprites");
const TARGET_SIZE = 96;

interface Pixel {
  r: number;
  g: number;
  b: number;
}

function colorDistance(a: Pixel, b: Pixel): number {
  return Math.sqrt(
    (a.r - b.r) ** 2 +
    (a.g - b.g) ** 2 +
    (a.b - b.b) ** 2
  );
}

/**
 * Compute local contrast (edge strength) at a pixel using Sobel-like operator.
 * High values = strong edges (likely creature boundary).
 */
function localContrast(
  data: Buffer,
  width: number,
  height: number,
  x: number,
  y: number
): number {
  if (x <= 0 || x >= width - 1 || y <= 0 || y >= height - 1) return 0;

  const getGray = (px: number, py: number): number => {
    const idx = (py * width + px) * 4;
    return (data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114);
  };

  // Sobel kernels
  const gx =
    -getGray(x - 1, y - 1) + getGray(x + 1, y - 1) +
    -2 * getGray(x - 1, y) + 2 * getGray(x + 1, y) +
    -getGray(x - 1, y + 1) + getGray(x + 1, y + 1);

  const gy =
    -getGray(x - 1, y - 1) - 2 * getGray(x, y - 1) - getGray(x + 1, y - 1) +
    getGray(x - 1, y + 1) + 2 * getGray(x, y + 1) + getGray(x + 1, y + 1);

  return Math.sqrt(gx * gx + gy * gy);
}

/**
 * Gradient-aware flood-fill from edges.
 * Instead of comparing to a single background color, we compare each pixel
 * to its NEIGHBOR that's already confirmed as background. This naturally
 * traverses smooth gradients while stopping at sharp edges (the creature).
 */
function gradientFloodFill(
  data: Buffer,
  width: number,
  height: number,
  neighborThreshold: number,
  edgeThreshold: number
): Set<number> {
  const totalPixels = width * height;
  const visited = new Uint8Array(totalPixels);
  const background = new Set<number>();

  const getPixel = (idx: number): Pixel => ({
    r: data[idx * 4],
    g: data[idx * 4 + 1],
    b: data[idx * 4 + 2],
  });

  // Priority queue: process pixels with lower contrast first (smoother = more likely bg)
  // Use a simple BFS queue but sort seed pixels by edge distance
  const queue: Array<{ idx: number; parentIdx: number }> = [];

  // Seed from all edge pixels
  for (let x = 0; x < width; x++) {
    queue.push({ idx: x, parentIdx: x }); // top
    queue.push({ idx: (height - 1) * width + x, parentIdx: (height - 1) * width + x }); // bottom
  }
  for (let y = 1; y < height - 1; y++) {
    queue.push({ idx: y * width, parentIdx: y * width }); // left
    queue.push({ idx: y * width + (width - 1), parentIdx: y * width + (width - 1) }); // right
  }

  // Mark all edge pixels as background (they're always background in DALL-E output)
  for (const item of queue) {
    visited[item.idx] = 1;
    background.add(item.idx);
  }

  let head = 0;
  while (head < queue.length) {
    const { idx: currentIdx } = queue[head++];
    const currentPixel = getPixel(currentIdx);
    const x = currentIdx % width;
    const y = Math.floor(currentIdx / width);

    // Check 4-directional neighbors
    const neighbors = [];
    if (x > 0) neighbors.push(currentIdx - 1);
    if (x < width - 1) neighbors.push(currentIdx + 1);
    if (y > 0) neighbors.push(currentIdx - width);
    if (y < height - 1) neighbors.push(currentIdx + width);

    for (const neighborIdx of neighbors) {
      if (visited[neighborIdx]) continue;
      visited[neighborIdx] = 1;

      const neighborPixel = getPixel(neighborIdx);
      const dist = colorDistance(currentPixel, neighborPixel);

      // Check if the neighbor is similar enough to current (background) pixel
      if (dist < neighborThreshold) {
        // Also check: is there a strong edge here?
        const nx = neighborIdx % width;
        const ny = Math.floor(neighborIdx / width);
        const contrast = localContrast(data, width, height, nx, ny);

        if (contrast < edgeThreshold) {
          background.add(neighborIdx);
          queue.push({ idx: neighborIdx, parentIdx: currentIdx });
        }
      }
    }
  }

  return background;
}

/**
 * Apply feathered edges on boundary pixels for smooth transitions.
 */
function featherEdges(
  output: Buffer,
  width: number,
  height: number,
  bgPixels: Set<number>,
  featherRadius: number = 2
): void {
  // Find boundary pixels (bg pixels adjacent to non-bg)
  const boundaries = new Set<number>();
  for (const pixelIdx of bgPixels) {
    const x = pixelIdx % width;
    const y = Math.floor(pixelIdx / width);

    const hasNonBgNeighbor = [
      pixelIdx - 1,
      pixelIdx + 1,
      pixelIdx - width,
      pixelIdx + width,
    ].some((n) => n >= 0 && n < width * height && !bgPixels.has(n));

    if (hasNonBgNeighbor) boundaries.add(pixelIdx);
  }

  // For pixels near boundaries, apply gradual transparency
  for (let radius = 1; radius <= featherRadius; radius++) {
    const alpha = Math.floor(((featherRadius - radius + 1) / (featherRadius + 1)) * 128);
    for (const bIdx of boundaries) {
      const bx = bIdx % width;
      const by = Math.floor(bIdx / width);

      // Check pixels at this radius that are NOT background
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          if (Math.abs(dx) + Math.abs(dy) !== radius) continue; // Manhattan distance
          const nx = bx + dx;
          const ny = by + dy;
          if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
          const nIdx = ny * width + nx;
          if (bgPixels.has(nIdx)) continue;

          // This is a foreground pixel near the boundary — soften its alpha
          const outIdx = nIdx * 4;
          const currentAlpha = output[outIdx + 3];
          output[outIdx + 3] = Math.min(currentAlpha, 255 - Math.floor(alpha * 0.3));
        }
      }
    }
  }
}

async function processSprite(
  filepath: string,
  neighborThreshold: number,
  edgeThreshold: number,
  skipResize: boolean
): Promise<{ success: boolean; filename: string }> {
  const filename = path.basename(filepath);

  try {
    const image = sharp(filepath);
    const metadata = await image.metadata();
    const { width = 0, height = 0 } = metadata;

    // Get raw RGBA pixel data
    const rawData = await image
      .ensureAlpha()
      .raw()
      .toBuffer();

    // Gradient-aware flood fill from edges
    const bgPixels = gradientFloodFill(
      rawData,
      width,
      height,
      neighborThreshold,
      edgeThreshold
    );

    // Create output buffer with transparency
    const output = Buffer.from(rawData);
    for (const pixelIdx of bgPixels) {
      const idx = pixelIdx * 4;
      output[idx] = 0;     // R
      output[idx + 1] = 0; // G
      output[idx + 2] = 0; // B
      output[idx + 3] = 0; // A
    }

    // Feather edges for smooth transition
    featherEdges(output, width, height, bgPixels, 2);

    const bgPercentage = ((bgPixels.size / (width * height)) * 100).toFixed(1);

    // Build the output pipeline
    let pipeline = sharp(output, {
      raw: { width, height, channels: 4 },
    }).png();

    if (!skipResize) {
      pipeline = pipeline.resize(TARGET_SIZE, TARGET_SIZE, {
        kernel: sharp.kernel.lanczos3,
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      });
    }

    const outputBuffer = await pipeline.toBuffer();
    fs.writeFileSync(filepath, outputBuffer);

    console.log(
      `  ✓ ${filename} — removed ${bgPercentage}% background` +
      (skipResize ? "" : ` → ${TARGET_SIZE}×${TARGET_SIZE}`)
    );

    return { success: true, filename };
  } catch (error: any) {
    console.error(`  ✗ ${filename}: ${error.message}`);
    return { success: false, filename };
  }
}

async function main() {
  const args = process.argv.slice(2);
  const onlyIds = args.includes("--only")
    ? args[args.indexOf("--only") + 1].split(",").map(Number)
    : null;
  const neighborThreshold = args.includes("--threshold")
    ? parseInt(args[args.indexOf("--threshold") + 1])
    : 25;
  const edgeThreshold = args.includes("--edge-threshold")
    ? parseInt(args[args.indexOf("--edge-threshold") + 1])
    : 40;
  const skipResize = args.includes("--skip-resize");

  console.log("🎨 Sprite Background Remover (gradient-aware)");
  console.log(`  Neighbor threshold: ${neighborThreshold} | Edge threshold: ${edgeThreshold}`);
  console.log(`  Resize: ${!skipResize ? `${TARGET_SIZE}×${TARGET_SIZE}` : "skip"}\n`);

  // Find all PNG sprites
  const files = fs.readdirSync(SPRITES_DIR)
    .filter((f) => f.endsWith(".png") && !f.startsWith("_"))
    .filter((f) => {
      if (!onlyIds) return true;
      const id = parseInt(f.split(".")[0].split("-")[0]);
      return onlyIds.includes(id);
    })
    .sort((a, b) => {
      const idA = parseInt(a.split(".")[0].split("-")[0]);
      const idB = parseInt(b.split(".")[0].split("-")[0]);
      return idA - idB;
    });

  console.log(`Found ${files.length} PNG sprites to process.\n`);

  // Backup originals first
  const backupDir = path.join(SPRITES_DIR, "_originals");
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
    console.log("Backing up originals...");
    for (const file of files) {
      const src = path.join(SPRITES_DIR, file);
      const dst = path.join(backupDir, file);
      if (!fs.existsSync(dst)) {
        fs.copyFileSync(src, dst);
      }
    }
    console.log(`  Backed up ${files.length} files to ${backupDir}\n`);
  } else {
    // Restore from originals before reprocessing
    console.log("Restoring from originals before reprocessing...");
    for (const file of files) {
      const src = path.join(backupDir, file);
      const dst = path.join(SPRITES_DIR, file);
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, dst);
      }
    }
    console.log(`  Restored ${files.length} files\n`);
  }

  let successes = 0;
  let failures = 0;

  for (const file of files) {
    const filepath = path.join(SPRITES_DIR, file);
    const result = await processSprite(filepath, neighborThreshold, edgeThreshold, skipResize);
    if (result.success) successes++;
    else failures++;
  }

  console.log(`\n✅ Done! ${successes} processed, ${failures} failed.`);
}

main().catch(console.error);
