import { requireUser } from "@/lib/auth";
import { getUserCollection, getCardboardexCompletion } from "@/lib/boxes";
import { TOTAL_CREATURES } from "@/db/creature-data";
import { getUserBadges } from "./actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Map, Flame, Star, ClipboardList, CheckCircle } from "lucide-react";
import Link from "next/link";

const BADGE_LABELS: Record<string, string> = {
  first_report: "First Report",
  verified_10: "10 Verified",
  verified_50: "50 Verified",
  trusted_reporter: "Trusted Reporter",
  top_reporter: "Top Reporter",
  streak_7: "7-Day Streak",
  streak_30: "30-Day Streak",
  cardboardex_50: "50 Creatures",
  cardboardex_complete: "Cardboardex Complete",
};

export default async function DashboardPage() {
  const user = await requireUser();

  const [allBoxes, badges] = await Promise.all([
    getUserCollection(user.id),
    getUserBadges(user.id),
  ]);

  const openedBoxes = allBoxes.filter((b) => b.opened && b.creatureId);
  const pendingBoxes = allBoxes.filter((b) => !b.opened);
  const uniqueCaught = getCardboardexCompletion(openedBoxes);
  const accuracy =
    user.totalReports > 0
      ? Math.round((user.verifiedReports / user.totalReports) * 100)
      : 0;

  return (
    <div className="container mx-auto py-4 px-4 max-w-2xl page-fade-in">
      <h2 className="text-xl font-semibold mb-6">Welcome back</h2>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="flex items-center gap-2 rounded-lg border bg-card p-3">
          <Flame className="w-4 h-4 text-orange-500" />
          <div>
            <div className="text-xs text-muted-foreground">Streak</div>
            <div className="font-semibold">{user.currentStreak}d</div>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg border bg-card p-3">
          <Star className="w-4 h-4 text-yellow-500" />
          <div>
            <div className="text-xs text-muted-foreground">Trust</div>
            <div className="font-semibold">{user.trustScore}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg border bg-card p-3">
          <ClipboardList className="w-4 h-4 text-blue-500" />
          <div>
            <div className="text-xs text-muted-foreground">Reports</div>
            <div className="font-semibold">{user.totalReports}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg border bg-card p-3">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <div>
            <div className="text-xs text-muted-foreground">Accuracy</div>
            <div className="font-semibold">{accuracy}%</div>
          </div>
        </div>
      </div>

      {/* Quick Action */}
      <Link href="/dashboard/map" className="block mb-6">
        <Button className="w-full" size="lg">
          <Map className="w-4 h-4 mr-2" />
          Open Map
        </Button>
      </Link>

      {/* Pending Boxes */}
      {pendingBoxes.length > 0 && (
        <Card className="mb-6 gold-glow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">
                  You have{" "}
                  <span className="text-primary font-bold">
                    {pendingBoxes.length} {pendingBoxes.length === 1 ? "box" : "boxes"}
                  </span>{" "}
                  waiting to open!
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Boxes open when your report is verified.
                </p>
              </div>
              <Link href="/dashboard/collection">
                <Button variant="outline" size="sm">
                  View Collection
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Collection Progress */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Cardboardex</CardTitle>
            <Link
              href="/dashboard/collection"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              View all &rarr;
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">
              {uniqueCaught}/{TOTAL_CREATURES} discovered
            </span>
            <span className="font-medium">
              {Math.round((uniqueCaught / TOTAL_CREATURES) * 100)}%
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-primary to-accent rounded-full h-3 transition-all"
              style={{ width: `${(uniqueCaught / TOTAL_CREATURES) * 100}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Badges */}
      {badges.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Badges</CardTitle>
              <Link
                href="/dashboard/leaderboard"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Leaderboard &rarr;
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {badges.map((b) => (
                <Badge key={b.badgeType} variant="secondary">
                  {BADGE_LABELS[b.badgeType] ?? b.badgeType}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
