import { db } from "@/db";
import { users, reporterBadges, creatureBoxes } from "@/db/schema";
import { desc, gt, sql, eq } from "drizzle-orm";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import { cn } from "@/lib/utils";

const BADGE_LABELS: Record<string, string> = {
  first_report: "First Report",
  verified_10: "10 Verified",
  verified_50: "50 Verified",
  trusted_reporter: "Trusted",
  top_reporter: "Top Reporter",
  streak_7: "7-Day Streak",
  streak_30: "30-Day Streak",
  cardboardex_50: "50 Creatures",
  cardboardex_complete: "Cardboardex Complete",
};

export default async function LeaderboardPage() {
  const currentUser = await getCurrentUser();

  const topReporters = await db
    .select({
      id: users.id,
      email: users.email,
      trustScore: users.trustScore,
      totalReports: users.totalReports,
      verifiedReports: users.verifiedReports,
      currentStreak: users.currentStreak,
      accuracy: sql<number>`
        CASE WHEN total_reports > 0
          THEN ROUND(verified_reports::numeric / total_reports * 100)
          ELSE 0
        END
      `.as("accuracy"),
    })
    .from(users)
    .where(gt(users.totalReports, 0))
    .orderBy(desc(users.trustScore))
    .limit(25);

  // Fetch badges for all top reporters
  const allBadges = await db
    .select({
      userId: reporterBadges.userId,
      badgeType: reporterBadges.badgeType,
    })
    .from(reporterBadges);

  const badgeMap = new Map<string, string[]>();
  for (const b of allBadges) {
    if (!badgeMap.has(b.userId)) badgeMap.set(b.userId, []);
    badgeMap.get(b.userId)!.push(b.badgeType);
  }

  // Fetch pokedex completion for all users
  const pokedexData = await db
    .select({
      userId: creatureBoxes.userId,
      uniqueCaught: sql<number>`COUNT(DISTINCT pokemon_id)::int`,
    })
    .from(creatureBoxes)
    .where(eq(creatureBoxes.hatched, true))
    .groupBy(creatureBoxes.userId);

  const pokedexMap = new Map<string, number>();
  for (const p of pokedexData) {
    pokedexMap.set(p.userId, p.uniqueCaught);
  }

  const trustLevel = (score: number) => {
    if (score >= 100) return "Top Reporter";
    if (score >= 50) return "Trusted";
    if (score >= 10) return "Contributor";
    return "Newcomer";
  };

  const rankAccent = (rank: number) => {
    if (rank === 1) return "border-l-4 border-l-gold";
    if (rank === 2) return "border-l-4 border-l-[#a8a8b0]";
    if (rank === 3) return "border-l-4 border-l-[#cd7f32]";
    return "";
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Leaderboard</h2>

      {/* Current user stats */}
      {currentUser && currentUser.totalReports > 0 && (
        <Card className="mb-6 border-primary/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Your Stats</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-6 text-sm">
            <div>
              <span className="text-muted-foreground">Trust Score:</span>{" "}
              <span className="font-medium">{currentUser.trustScore}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Level:</span>{" "}
              <span className="font-medium">{trustLevel(currentUser.trustScore)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Reports:</span>{" "}
              <span className="font-medium">{currentUser.verifiedReports}/{currentUser.totalReports} verified</span>
            </div>
            <div>
              <span className="text-muted-foreground">Streak:</span>{" "}
              <span className="font-medium">{currentUser.currentStreak} days</span>
            </div>
            <div>
              <span className="text-muted-foreground">Cardboardex:</span>{" "}
              <span className="font-medium">
                {pokedexMap.get(currentUser.id) ?? 0}/151
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">#</TableHead>
            <TableHead>Reporter</TableHead>
            <TableHead>Trust Score</TableHead>
            <TableHead>Level</TableHead>
            <TableHead>Reports</TableHead>
            <TableHead>Accuracy</TableHead>
            <TableHead>Streak</TableHead>
            <TableHead>Badges</TableHead>
            <TableHead>Cardboardex</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {topReporters.map((reporter, i) => {
            const badges = badgeMap.get(reporter.id) ?? [];
            const isCurrentUser = currentUser?.id === reporter.id;
            return (
              <TableRow key={reporter.id} className={cn(
                isCurrentUser ? "bg-primary/5" : i % 2 !== 0 ? "bg-muted/30" : "",
                rankAccent(i + 1)
              )}>
                <TableCell className="font-medium">{i + 1}</TableCell>
                <TableCell>
                  {reporter.email.split("@")[0]}
                  {isCurrentUser && <span className="text-xs text-muted-foreground ml-1">(you)</span>}
                </TableCell>
                <TableCell>{reporter.trustScore}</TableCell>
                <TableCell>
                  <Badge variant={reporter.trustScore >= 50 ? "gold" : reporter.trustScore >= 10 ? "teal" : "outline"}>
                    {trustLevel(reporter.trustScore)}
                  </Badge>
                </TableCell>
                <TableCell>{reporter.verifiedReports}/{reporter.totalReports}</TableCell>
                <TableCell>{reporter.accuracy}%</TableCell>
                <TableCell>{reporter.currentStreak}d</TableCell>
                <TableCell className="flex gap-1 flex-wrap">
                  {badges.map((b) => (
                    <Badge key={b} variant="secondary" className="text-xs">
                      {BADGE_LABELS[b] ?? b}
                    </Badge>
                  ))}
                </TableCell>
                <TableCell>{pokedexMap.get(reporter.id) ?? 0}/151</TableCell>
              </TableRow>
            );
          })}
          {topReporters.length === 0 && (
            <TableRow>
              <TableCell colSpan={9} className="text-center text-muted-foreground">
                No reporters yet. Be the first to submit a sighting!
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
