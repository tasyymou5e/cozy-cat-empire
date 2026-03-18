import React, { useMemo, memo } from 'react';
import { Cat, BREEDS } from '@/types/game';
import { CatRelationship, getRelationshipLevel } from '@/types/relationships';
import { GradeBadge } from './GradeBadge';
import { CatVisual } from './CatVisual';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Star, Heart, Sparkles } from 'lucide-react';

interface LeaderboardPanelProps {
  cats: Cat[];
  relationships: CatRelationship[];
  catCostumes?: Record<string, string>;
}

const rankEmojis = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];

interface RankedCat extends Cat {
  rank: number;
  score: number;
}

// Memoized list item component
const LeaderboardListItem = memo(function LeaderboardListItem({
  cat,
  icon,
  costumeId,
}: {
  cat: RankedCat;
  icon: React.ReactNode;
  costumeId?: string;
}) {
  return (
    <div
      className={`flex items-center gap-3 p-2 rounded-lg ${
        cat.rank === 1
          ? 'bg-yellow-100/50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700'
          : cat.rank === 2
            ? 'bg-muted/30 border border-border'
            : cat.rank === 3
              ? 'bg-orange-100/50 dark:bg-orange-900/20 border border-orange-300 dark:border-orange-700'
              : 'bg-secondary/30'
      }`}
    >
      <span className="text-lg w-6 text-center">
        {rankEmojis[cat.rank - 1] || `${cat.rank}`}
      </span>
      <CatVisual cat={cat} size="xs" equippedCostumeId={costumeId} />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate">{cat.name}</p>
        <p className="text-xs text-muted-foreground">{BREEDS[cat.breed].name}</p>
      </div>
      <div className="flex items-center gap-1">
        {icon}
        <span className="font-bold text-sm">{cat.score}</span>
      </div>
      <GradeBadge grade={cat.grade} size="sm" />
    </div>
  );
});

// Memoized list component
const LeaderboardList = memo(function LeaderboardList({
  rankedCats,
  label,
  icon,
  catCostumes,
}: {
  rankedCats: RankedCat[];
  label: string;
  icon: React.ReactNode;
  catCostumes?: Record<string, string>;
}) {
  return (
    <div className="space-y-2">
      {rankedCats.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">No cats yet!</p>
      ) : (
        rankedCats.map((cat) => (
          <LeaderboardListItem
            key={cat.id}
            cat={cat}
            icon={icon}
            costumeId={catCostumes?.[cat.id]}
          />
        ))
      )}
    </div>
  );
});

export const LeaderboardPanel = memo(function LeaderboardPanel({
  cats,
  relationships,
  catCostumes,
}: LeaderboardPanelProps) {
  // Memoize sorted lists
  const byWins = useMemo<RankedCat[]>(
    () =>
      [...cats]
        .sort((a, b) => b.showWins - a.showWins)
        .slice(0, 5)
        .map((cat, i) => ({ ...cat, rank: i + 1, score: cat.showWins })),
    [cats]
  );

  const byGrade = useMemo<RankedCat[]>(
    () =>
      [...cats]
        .sort((a, b) => b.grade - a.grade)
        .slice(0, 5)
        .map((cat, i) => ({ ...cat, rank: i + 1, score: cat.grade })),
    [cats]
  );

  const byValue = useMemo<RankedCat[]>(
    () =>
      [...cats]
        .sort((a, b) => b.value - a.value)
        .slice(0, 5)
        .map((cat, i) => ({ ...cat, rank: i + 1, score: cat.value })),
    [cats]
  );

  const byPopularity = useMemo<RankedCat[]>(
    () =>
      [...cats]
        .map((cat) => {
          const catRels = relationships.filter(
            (r) => r.catId1 === cat.id || r.catId2 === cat.id
          );
          const friendCount = catRels.filter((r) => {
            const level = getRelationshipLevel(r.score);
            return level === 'friend' || level === 'bestFriend';
          }).length;
          return { ...cat, friendCount };
        })
        .sort((a, b) => b.friendCount - a.friendCount)
        .slice(0, 5)
        .map((cat, i) => ({ ...cat, rank: i + 1, score: cat.friendCount })),
    [cats, relationships]
  );

  const totalWins = useMemo(
    () => cats.reduce((sum, c) => sum + c.showWins, 0),
    [cats]
  );
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <Trophy className="h-5 w-5 text-yellow-500" />
        <h3 className="font-bold">Leaderboard</h3>
      </div>

      <Tabs defaultValue="wins" className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-8">
          <TabsTrigger value="wins" className="text-xs px-1">
            <Trophy className="h-3 w-3 mr-1" /> Wins
          </TabsTrigger>
          <TabsTrigger value="grade" className="text-xs px-1">
            <Star className="h-3 w-3 mr-1" /> Grade
          </TabsTrigger>
          <TabsTrigger value="value" className="text-xs px-1">
            <Sparkles className="h-3 w-3 mr-1" /> Value
          </TabsTrigger>
          <TabsTrigger value="popular" className="text-xs px-1">
            <Heart className="h-3 w-3 mr-1" /> Popular
          </TabsTrigger>
        </TabsList>

        <TabsContent value="wins" className="mt-3">
          <LeaderboardList
            rankedCats={byWins}
            label="Wins"
            icon={<Trophy className="h-3 w-3 text-yellow-500" />}
            catCostumes={catCostumes}
          />
        </TabsContent>

        <TabsContent value="grade" className="mt-3">
          <LeaderboardList
            rankedCats={byGrade}
            label="Grade"
            icon={<Star className="h-3 w-3 text-purple-500" />}
            catCostumes={catCostumes}
          />
        </TabsContent>

        <TabsContent value="value" className="mt-3">
          <LeaderboardList
            rankedCats={byValue}
            label="Value"
            icon={<span className="text-xs text-green-600">$</span>}
            catCostumes={catCostumes}
          />
        </TabsContent>

        <TabsContent value="popular" className="mt-3">
          <LeaderboardList
            rankedCats={byPopularity}
            label="Friends"
            icon={<Heart className="h-3 w-3 text-pink-500" />}
            catCostumes={catCostumes}
          />
        </TabsContent>
      </Tabs>

      {cats.length > 0 && (
        <div className="pt-2 border-t border-border">
          <div className="grid grid-cols-2 gap-2 text-xs text-center">
            <div className="p-2 bg-secondary/30 rounded">
              <div className="text-muted-foreground">Total Cats</div>
              <div className="font-bold">{cats.length}</div>
            </div>
            <div className="p-2 bg-secondary/30 rounded">
              <div className="text-muted-foreground">Total Wins</div>
              <div className="font-bold">{totalWins}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
