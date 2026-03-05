import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(__dirname, "../../../.env.local") });
if (!process.env.DATABASE_URL) {
  config({ path: resolve(__dirname, "../.env.local") });
}
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL not found.");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

async function main() {
  console.log("Clearing test submission data...\n");

  // Delete in FK-safe order
  const boxes = await sql`DELETE FROM creature_boxes RETURNING id`;
  console.log(`  creature_boxes:     ${boxes.length} deleted`);

  const badges = await sql`DELETE FROM reporter_badges RETURNING id`;
  console.log(`  reporter_badges:    ${badges.length} deleted`);

  const patterns = await sql`DELETE FROM restock_patterns RETURNING id`;
  console.log(`  restock_patterns:   ${patterns.length} deleted`);

  const alerts = await sql`DELETE FROM alert_preferences RETURNING id`;
  console.log(`  alert_preferences:  ${alerts.length} deleted`);

  const sightings = await sql`DELETE FROM restock_sightings RETURNING id`;
  console.log(`  restock_sightings:  ${sightings.length} deleted`);

  // Reset user stats but keep accounts
  const users = await sql`
    UPDATE users
    SET trust_score = 0,
        total_reports = 0,
        verified_reports = 0,
        current_streak = 0,
        last_report_date = NULL
    RETURNING id
  `;
  console.log(`  users reset:        ${users.length} updated`);

  console.log("\nDone. Stores, products, creature catalog, and user accounts preserved.");
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
