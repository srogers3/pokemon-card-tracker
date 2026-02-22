import { requireUser } from "@/lib/auth";
import { getUserCollection, getPokedexCompletion } from "@/lib/eggs";
import { POKEMON_DATA, getSpriteUrl } from "@/db/pokemon-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function CollectionPage() {
  const user = await requireUser();
  const allEggs = await getUserCollection(user.id);

  const hatchedEggs = allEggs.filter((e) => e.hatched && e.pokemonId);
  const pendingEggs = allEggs.filter((e) => !e.hatched);
  const uniqueCaught = getPokedexCompletion(hatchedEggs);

  // Build a map of caught Pokemon: pokemonId -> { count, shinyCount }
  const caughtMap = new Map<
    number,
    { count: number; shinyCount: number }
  >();
  for (const egg of hatchedEggs) {
    if (!egg.pokemonId) continue;
    const existing = caughtMap.get(egg.pokemonId) ?? {
      count: 0,
      shinyCount: 0,
    };
    existing.count++;
    if (egg.isShiny) existing.shinyCount++;
    caughtMap.set(egg.pokemonId, existing);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Pokemon Collection</h2>
        <Badge variant="outline" className="text-sm">
          {uniqueCaught}/151 caught
        </Badge>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-muted rounded-full h-3 mb-6">
        <div
          className="bg-primary rounded-full h-3 transition-all"
          style={{ width: `${(uniqueCaught / 151) * 100}%` }}
        />
      </div>

      {/* Pending eggs */}
      {pendingEggs.length > 0 && (
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              Pending Eggs ({pendingEggs.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              {pendingEggs.map((egg) => (
                <div
                  key={egg.id}
                  className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center text-lg"
                  title={`Egg from ${egg.reportStatus} report — waiting for verification`}
                >
                  🥚
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Eggs hatch when your report is verified!
            </p>
          </CardContent>
        </Card>
      )}

      {/* Pokedex grid */}
      <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2">
        {POKEMON_DATA.sort((a, b) => a.id - b.id).map((pokemon) => {
          const caught = caughtMap.get(pokemon.id);
          const isCaught = !!caught;

          return (
            <div
              key={pokemon.id}
              className={`relative aspect-square rounded-lg border p-1 flex flex-col items-center justify-center ${
                isCaught
                  ? "bg-background border-primary/30"
                  : "bg-muted/50 border-transparent"
              }`}
              title={
                isCaught
                  ? `#${pokemon.id} ${pokemon.name} (${caught.count}x${caught.shinyCount > 0 ? `, ${caught.shinyCount} shiny` : ""})`
                  : `#${pokemon.id} ???`
              }
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getSpriteUrl(pokemon.id)}
                alt={isCaught ? pokemon.name : "???"}
                className={`w-10 h-10 ${isCaught ? "" : "brightness-0 opacity-30"}`}
                loading="lazy"
              />
              {isCaught && caught.shinyCount > 0 && (
                <span className="absolute top-0 right-0 text-xs">✨</span>
              )}
              {isCaught && caught.count > 1 && (
                <span className="absolute bottom-0 right-0 text-[10px] bg-primary text-primary-foreground rounded-full w-4 h-4 flex items-center justify-center">
                  {caught.count}
                </span>
              )}
              <span className="text-[9px] text-muted-foreground truncate w-full text-center">
                {isCaught ? pokemon.name : `#${pokemon.id}`}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
