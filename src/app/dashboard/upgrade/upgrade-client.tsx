"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
      <h2 className="text-2xl font-bold mb-6 text-center">
        Go <span className="text-gold">Premium</span>
      </h2>
      <Card className="gold-glow border-gold/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Premium Membership
            <Badge variant="gold">PRO</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2"><span className="text-teal">✓</span> Full sighting history (no 48h limit)</li>
            <li className="flex items-center gap-2"><span className="text-teal">✓</span> Restock heatmaps by store and region</li>
            <li className="flex items-center gap-2"><span className="text-teal">✓</span> Email alerts for products you want</li>
            <li className="flex items-center gap-2"><span className="text-teal">✓</span> Submit community restock tips</li>
            <li className="flex items-center gap-2"><span className="text-teal">✓</span> Advanced filters (date range, store, product)</li>
          </ul>
          <Button onClick={handleUpgrade} variant="gold" className="w-full">
            Subscribe Now
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
