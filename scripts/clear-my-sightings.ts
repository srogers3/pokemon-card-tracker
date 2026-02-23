import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(__dirname, "../../../.env.local") });
if (!process.env.DATABASE_URL) {
  config({ path: resolve(__dirname, "../.env.local") });
}
if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL not found.");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

async function main() {
  const users = await sql`SELECT id FROM users LIMIT 1`;
  if (users.length === 0) {
    console.error("❌ No users found.");
    process.exit(1);
  }
  const userId = users[0].id;

  const countResult = await sql`
    SELECT count(*)::int as count FROM restock_sightings WHERE reported_by = ${userId}
  `;
  const count = countResult[0].count;

  if (count === 0) {
    console.log(`No sightings found for user ${userId}.`);
    return;
  }

  console.log(`🗑️  Deleting ${count} sightings for user ${userId}...`);

  await sql`DELETE FROM restock_sightings WHERE reported_by = ${userId}`;

  console.log(`✅ Done. Deleted ${count} sightings.`);
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
