import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { config } from "dotenv";
import { resolve } from "path";

// Load .env.local from the main repo (worktree doesn't have its own)
config({ path: resolve(__dirname, "../../../.env.local") });

if (!process.env.DATABASE_URL) {
  // Fallback: try the worktree's own .env.local
  config({ path: resolve(__dirname, "../.env.local") });
}

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL not found. Make sure .env.local exists.");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

async function main() {
  // 1. Get a product ID
  const products = await sql`SELECT id, name FROM products LIMIT 5`;
  if (products.length === 0) {
    console.error("❌ No products found. Seed some products first.");
    process.exit(1);
  }
  console.log("📦 Available products:");
  products.forEach((p) => console.log(`   ${p.id}  ${p.name}`));
  const productId = products[0].id;
  console.log(`\n   Using: ${products[0].name}\n`);

  // 2. Get a user ID
  const users = await sql`SELECT id FROM users LIMIT 1`;
  if (users.length === 0) {
    console.error("❌ No users found. Log in to the app first.");
    process.exit(1);
  }
  const userId = users[0].id;
  console.log(`👤 Using user: ${userId}\n`);

  // Helper to create a date N days ago at a specific hour
  function daysAgo(days: number, hour: number = 10): Date {
    const d = new Date();
    d.setDate(d.getDate() - days);
    d.setHours(hour, Math.floor(Math.random() * 60), 0, 0);
    return d;
  }

  // Define seed data per store
  const seeds = [
    {
      name: "The Pokeshop & Collectibles (Denver)",
      storeId: "25f6d4df-4bfe-40b7-b810-5bf9a70205d4",
      grade: "HOT",
      dates: [
        daysAgo(14, 9), daysAgo(12, 10), daysAgo(10, 9),
        daysAgo(8, 9), daysAgo(6, 10), daysAgo(4, 9),
        daysAgo(2, 11), daysAgo(1, 9),
      ],
    },
    {
      name: "Walmart Supercenter (Denver)",
      storeId: "ae5cf6d4-dc61-4e23-bfd2-88dad53117db",
      grade: "WARM",
      dates: [
        daysAgo(25, 13), daysAgo(20, 14), daysAgo(15, 13),
        daysAgo(8, 14), daysAgo(3, 13),
      ],
    },
    {
      name: "Shipwreck Sports & Collectibles (Denver)",
      storeId: "eff0822d-4d52-43b7-ab95-979176c1f4d9",
      grade: "COOL",
      dates: [
        daysAgo(40, 16), daysAgo(30, 17), daysAgo(18, 15), daysAgo(7, 18),
      ],
    },
    {
      name: "Dollar General (Denver, NC-16)",
      storeId: "bec4944b-8efe-4aa5-9cea-fc1157178e0b",
      grade: "COLD (low data)",
      dates: [daysAgo(30, 10), daysAgo(5, 14)],
    },
    {
      name: "CVS (Denver, Webbs Rd)",
      storeId: "5a58184e-dfd8-4e1e-981a-0080f640e788",
      grade: "COLD (infrequent)",
      dates: [daysAgo(60, 11), daysAgo(35, 15), daysAgo(10, 9)],
    },
  ];

  let total = 0;

  for (const store of seeds) {
    console.log(`🏪 ${store.name} → expected ${store.grade}`);

    for (const sightedAt of store.dates) {
      await sql`
        INSERT INTO restock_sightings (store_id, product_id, reported_by, sighted_at, status, verified, source)
        VALUES (${store.storeId}, ${productId}, ${userId}, ${sightedAt.toISOString()}, 'found', true, 'community')
      `;
      total++;
    }

    console.log(`   ✅ Inserted ${store.dates.length} sightings\n`);
  }

  console.log(`\n🎉 Done! Inserted ${total} total sightings across ${seeds.length} stores.`);
  console.log(`   Refresh the map and click on these stores to see Restock Intel.`);
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
