/**
 * Import sprites from JPG/JPEG/WebP files, converting them to PNG.
 *
 * Drop your Grok-generated images into public/sprites/ named by creature ID
 * (e.g., 1.jpg, 2.jpeg, 3.webp) and run this script to convert them to PNG.
 *
 * Usage:
 *   npx tsx scripts/import-sprites.ts              # Convert all non-PNG images
 *   npx tsx scripts/import-sprites.ts --only 1,5   # Specific IDs
 *   npx tsx scripts/import-sprites.ts --cleanup     # Delete source files after conversion
 */

import fs from "fs";
import path from "path";
import sharp from "sharp";

const SPRITES_DIR = path.join(process.cwd(), "public", "sprites");
const IMPORT_EXTENSIONS = [".jpg", ".jpeg", ".webp", ".bmp", ".tiff"];

async function convertToPng(
  srcPath: string,
  destPath: string
): Promise<void> {
  await sharp(srcPath)
    .ensureAlpha()
    .png()
    .toFile(destPath);
}

async function main() {
  const args = process.argv.slice(2);
  const onlyIds = args.includes("--only")
    ? args[args.indexOf("--only") + 1].split(",").map(Number)
    : null;
  const cleanup = args.includes("--cleanup");

  console.log("🔄 Sprite Importer (JPG/JPEG/WebP → PNG)");
  console.log(`  Source: ${SPRITES_DIR}\n`);

  const files = fs.readdirSync(SPRITES_DIR).filter((f) => {
    const ext = path.extname(f).toLowerCase();
    if (!IMPORT_EXTENSIONS.includes(ext)) return false;
    if (f.startsWith("_")) return false;
    if (onlyIds) {
      const id = parseInt(f.split(".")[0].split("-")[0]);
      return onlyIds.includes(id);
    }
    return true;
  });

  if (files.length === 0) {
    console.log("No JPG/JPEG/WebP files found to convert.");
    console.log("Drop files named like 1.jpg, 2.jpeg, etc. into public/sprites/");
    return;
  }

  console.log(`Found ${files.length} files to convert.\n`);

  let converted = 0;
  let skipped = 0;
  let failed = 0;

  for (const file of files) {
    const ext = path.extname(file);
    const basename = path.basename(file, ext);
    const srcPath = path.join(SPRITES_DIR, file);
    const destPath = path.join(SPRITES_DIR, `${basename}.png`);

    // Skip if PNG already exists and is newer
    if (fs.existsSync(destPath)) {
      const srcStat = fs.statSync(srcPath);
      const destStat = fs.statSync(destPath);
      if (destStat.mtimeMs > srcStat.mtimeMs) {
        console.log(`  ⊘ ${basename}.png already exists (newer), skipping`);
        skipped++;
        continue;
      }
    }

    try {
      await convertToPng(srcPath, destPath);
      const size = (fs.statSync(destPath).size / 1024).toFixed(1);
      console.log(`  ✓ ${file} → ${basename}.png (${size}KB)`);
      converted++;

      if (cleanup) {
        fs.unlinkSync(srcPath);
        console.log(`    🗑 Deleted ${file}`);
      }
    } catch (error: any) {
      console.error(`  ✗ ${file}: ${error.message}`);
      failed++;
    }
  }

  console.log(`\n✅ Done! ${converted} converted, ${skipped} skipped, ${failed} failed.`);

  if (!cleanup && converted > 0) {
    console.log(`\nTip: Run with --cleanup to delete source JPGs after conversion.`);
  }

  if (converted > 0) {
    console.log(`\nNext step: Run background removal:`);
    console.log(`  npx tsx scripts/remove-sprite-backgrounds.ts`);
  }
}

main().catch(console.error);
