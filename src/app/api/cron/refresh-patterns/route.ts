import { db } from "@/db";
import { restockPatterns } from "@/db/schema";
import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  // Verify cron secret
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Clear existing patterns
  await db.delete(restockPatterns);

  // Recompute from verified sightings
  await db.execute(sql`
    INSERT INTO restock_patterns (id, store_id, product_id, day_of_week, hour_of_day, frequency_count, last_updated)
    SELECT
      gen_random_uuid(),
      store_id,
      product_id,
      EXTRACT(DOW FROM sighted_at)::int,
      EXTRACT(HOUR FROM sighted_at)::int,
      COUNT(*)::int,
      NOW()
    FROM restock_sightings
    WHERE verified = true
    GROUP BY store_id, product_id, EXTRACT(DOW FROM sighted_at), EXTRACT(HOUR FROM sighted_at)
  `);

  return NextResponse.json({ success: true });
}
