"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function UpgradeClient() {
  async function handleUpgrade() {
    const res = await fetch("/api/stripe/checkout", { method: "POST" });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center">Go Premium</h2>
      <Card>
        <CardHeader>
          <CardTitle>Premium Membership</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-2 text-sm">
            <li>Full sighting history (no 48h limit)</li>
            <li>Restock heatmaps by store and region</li>
            <li>Email alerts for products you want</li>
            <li>Submit community restock tips</li>
            <li>Advanced filters (date range, store, product)</li>
          </ul>
          <Button onClick={handleUpgrade} className="w-full">
            Subscribe Now
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
