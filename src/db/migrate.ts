import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle(sql);
  await migrate(db, { migrationsFolder: "drizzle" });
  console.log("Migration complete");
}

main().catch(console.error);
