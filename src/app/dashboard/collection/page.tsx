import { requireUser } from "@/lib/auth";
import { getUserCollection, getCardboardexCompletion } from "@/lib/boxes";
import { CREATURE_DATA, TOTAL_CREATURES, getSpriteUrl } from "@/db/creature-data";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CollectionPendingSection } from "@/components/collection-pending-section";
import { getDevOverrides } from "@/lib/dev";

export default async function CollectionPage() {
  const user = await requireUser();
  const devOverrides = await getDevOverrides();
  const allEggs = await getUserCollection(user.id);

  const openedBoxes = allEggs.filter((e) => e.opened && e.creatureId);
  const pendingBoxes = allEggs.filter((e) => !e.opened);
  const uniqueCaught = getCardboardexCompletion(openedBoxes);

  // Find recent upgrades (opened in last 24h where creature differs from wild creature)
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentUpgrades = allEggs.filter(
    (e) =>
      e.opened &&
      e.creatureId &&
      e.wildCreatureId &&
      e.creatureId !== e.wildCreatureId &&
      e.openedAt &&
      new Date(e.openedAt) > oneDayAgo
  );

  // Build a map of caught creatures: creatureId -> { count, shinyCount }
  const caughtMap = new Map<
    number,
    { count: number; shinyCount: number }
  >();
  for (const box of openedBoxes) {
    if (!box.creatureId) continue;
    const existing = caughtMap.get(box.creatureId) ?? {
      count: 0,
      shinyCount: 0,
    };
    existing.count++;
    if (box.isShiny) existing.shinyCount++;
    caughtMap.set(box.creatureId, existing);
  }

  return (
    <div className="container mx-auto py-4 px-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Cardboardex</h2>
        <Badge variant="outline" className="text-sm">
          {uniqueCaught}/{TOTAL_CREATURES} discovered
        </Badge>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-muted rounded-full h-3 mb-6 overflow-hidden">
        <div
          className="bg-gradient-to-r from-primary to-accent rounded-full h-3 transition-all"
          style={{ width: `${(uniqueCaught / TOTAL_CREATURES) * 100}%` }}
        />
      </div>

      {/* Upgrade notifications */}
      {recentUpgrades.length > 0 && (
        <Card className="mb-6 border-amber-400/50 bg-amber-50/50 dark:bg-amber-950/20">
          <CardContent className="pt-4">
            <div className="flex flex-col gap-2">
              {recentUpgrades.map((box) => {
                const wildCreature = CREATURE_DATA.find((p) => p.id === box.wildCreatureId);
                const openedCreature = CREATURE_DATA.find((p) => p.id === box.creatureId);
                if (!wildCreature || !openedCreature) return null;
                return (
                  <div key={box.id} className="flex items-center gap-2 text-sm">
                    <span className="text-amber-500 font-medium">Lucky!</span>
                    <span>
                      You got a {openedCreature.name} instead of {wildCreature.name}!
                    </span>
                    {box.isShiny && <span>✨</span>}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending boxes */}
      <CollectionPendingSection
        pendingBoxes={pendingBoxes.map((box) => ({
          id: box.id,
          createdAt: box.createdAt.toISOString(),
          reportStatus: box.reportStatus,
        }))}
        isPremium={user.subscriptionTier === "premium" || devOverrides.simulatePremium}
        delayMs={devOverrides.skipDelay ? 10 * 1000 : undefined}
      />

      {/* Cardboardex grid */}
      <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2">
        {CREATURE_DATA.sort((a, b) => a.id - b.id).map((creature) => {
          const caught = caughtMap.get(creature.id);
          const isCaught = !!caught;

          return (
            <div
              key={creature.id}
              className={cn(
                "relative aspect-square rounded-xl border p-1 flex flex-col items-center justify-center",
                isCaught
                  ? "bg-card border-primary/20 creature-caught shadow-sm"
                  : "bg-muted/30 border-dashed border-border creature-uncaught"
              )}
              title={
                isCaught
                  ? `#${creature.id} ${creature.name} (${caught.count}x${caught.shinyCount > 0 ? `, ${caught.shinyCount} shiny` : ""})`
                  : `#${creature.id} ???`
              }
            >
              {isCaught && caught.shinyCount > 0 && (
                <div className="absolute inset-0 shimmer rounded-xl" />
              )}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getSpriteUrl(creature.id)}
                alt={isCaught ? creature.name : "???"}
                className={cn("w-10 h-10 relative z-10", !isCaught && "brightness-0 opacity-30")}
                loading="lazy"
              />
              {isCaught && caught.shinyCount > 0 && (
                <span className="absolute top-0 right-0 text-xs z-10">✨</span>
              )}
              {isCaught && caught.count > 1 && (
                <span className="absolute bottom-0 right-0 text-[10px] bg-teal text-white rounded-full w-4 h-4 flex items-center justify-center z-10">
                  {caught.count}
                </span>
              )}
              <span className="text-[9px] text-muted-foreground truncate w-full text-center relative z-10">
                {isCaught ? creature.name : `#${creature.id}`}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
