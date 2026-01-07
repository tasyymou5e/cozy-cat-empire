import { useState, useMemo } from 'react';
import { Cat } from '@/types/game';
import {
  CatRelationship,
  RelationshipEvent,
  RelationshipLevel,
  getRelationshipEmoji,
  getRelationshipColor,
  getDecayInfo,
  getDecayWarningColor,
  getDecayWarningText,
  RELATIONSHIP_THRESHOLDS,
} from '@/types/relationships';
import { CatVisual } from './CatVisual';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Search, SortAsc, AlertTriangle } from 'lucide-react';

interface RelationshipDirectoryProps {
  cats: Cat[];
  relationships: CatRelationship[];
  catCostumes?: Record<string, string>;
  events: RelationshipEvent[];
  currentDay?: number;
  onCatClick?: (catId: string) => void;
}

type FilterOption = 'all' | 'bestFriend' | 'friend' | 'rival' | 'enemy' | 'needs-attention';
type SortOption = 'score-desc' | 'score-asc' | 'recent' | 'name' | 'neglected';

export function RelationshipDirectory({
  cats,
  relationships,
  catCostumes,
  events,
  currentDay = 1,
  onCatClick,
}: RelationshipDirectoryProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterOption>('all');
  const [sortBy, setSortBy] = useState<SortOption>('score-desc');
  const [expandedPair, setExpandedPair] = useState<string | null>(null);

  const getCatName = (catId: string) => cats.find((c) => c.id === catId)?.name || 'Unknown';
  const getCat = (catId: string) => cats.find((c) => c.id === catId);

  const filteredRelationships = useMemo(() => {
    let rels = [...relationships];

    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase();
      rels = rels.filter((r) => {
        const name1 = getCatName(r.catId1).toLowerCase();
        const name2 = getCatName(r.catId2).toLowerCase();
        return name1.includes(searchLower) || name2.includes(searchLower);
      });
    }

    // Filter by relationship type
    if (filter === 'needs-attention') {
      rels = rels.filter((r) => {
        const decayInfo = getDecayInfo(r, currentDay);
        return decayInfo.daysSinceInteraction >= 2;
      });
    } else if (filter !== 'all') {
      rels = rels.filter((r) => r.level === filter);
    }

    // Sort
    switch (sortBy) {
      case 'score-desc':
        rels.sort((a, b) => b.score - a.score);
        break;
      case 'score-asc':
        rels.sort((a, b) => a.score - b.score);
        break;
      case 'recent':
        rels.sort((a, b) => b.lastInteraction - a.lastInteraction);
        break;
      case 'name':
        rels.sort((a, b) => getCatName(a.catId1).localeCompare(getCatName(b.catId1)));
        break;
      case 'neglected':
        rels.sort((a, b) => {
          const decayA = getDecayInfo(a, currentDay);
          const decayB = getDecayInfo(b, currentDay);
          return decayB.daysSinceInteraction - decayA.daysSinceInteraction;
        });
        break;
    }

    return rels;
  }, [relationships, search, filter, sortBy, cats, currentDay]);

  const getPairEvents = (catId1: string, catId2: string) => {
    return events
      .filter(
        (e) =>
          (e.catId1 === catId1 && e.catId2 === catId2) ||
          (e.catId1 === catId2 && e.catId2 === catId1)
      )
      .slice(0, 5);
  };

  const getScoreBarWidth = (score: number) => {
    // Convert -100 to 100 scale to 0-100%
    return ((score + 100) / 200) * 100;
  };

  const getScoreBarColor = (score: number) => {
    if (score >= 60) return 'bg-pink-500';
    if (score >= 20) return 'bg-green-500';
    if (score >= -20) return 'bg-gray-400';
    if (score >= -60) return 'bg-orange-500';
    return 'bg-red-500';
  };

  // Count relationships needing attention
  const needsAttentionCount = useMemo(() => {
    return relationships.filter((r) => getDecayInfo(r, currentDay).daysSinceInteraction >= 2)
      .length;
  }, [relationships, currentDay]);

  return (
    <TooltipProvider>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Relationship Directory</CardTitle>
          <p className="text-sm text-muted-foreground">All relationship pairs between your cats</p>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search cats..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={filter} onValueChange={(v) => setFilter(v as FilterOption)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="bestFriend">💕 Best Friends</SelectItem>
                <SelectItem value="friend">💚 Friends</SelectItem>
                <SelectItem value="rival">😾 Rivals</SelectItem>
                <SelectItem value="enemy">💔 Enemies</SelectItem>
                <SelectItem value="needs-attention">
                  ⚠️ Needs Attention ({needsAttentionCount})
                </SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <SortAsc className="h-4 w-4 text-muted-foreground" />
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="score-desc">Score (High)</SelectItem>
                  <SelectItem value="score-asc">Score (Low)</SelectItem>
                  <SelectItem value="recent">Recent</SelectItem>
                  <SelectItem value="neglected">Most Neglected</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Results Count */}
          <p className="text-sm text-muted-foreground mb-4">
            Showing {filteredRelationships.length} of {relationships.length} relationships
          </p>

          {/* Directory List */}
          <ScrollArea className="h-[500px]">
            {filteredRelationships.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {relationships.length === 0
                  ? 'No relationships formed yet. Cats will bond over time!'
                  : filter === 'needs-attention'
                    ? 'All relationships are healthy! 🎉'
                    : 'No relationships match your filters.'}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredRelationships.map((rel) => {
                  const cat1 = getCat(rel.catId1);
                  const cat2 = getCat(rel.catId2);
                  const pairKey = `${rel.catId1}-${rel.catId2}`;
                  const isExpanded = expandedPair === pairKey;
                  const pairEvents = getPairEvents(rel.catId1, rel.catId2);
                  const decayInfo = getDecayInfo(rel, currentDay);
                  const showWarning = decayInfo.daysSinceInteraction >= 2;

                  return (
                    <div
                      key={pairKey}
                      className={`p-4 rounded-lg border transition-colors ${
                        rel.level === 'bestFriend'
                          ? 'bg-pink-50 border-pink-200 dark:bg-pink-950/20 dark:border-pink-800'
                          : rel.level === 'friend'
                            ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800'
                            : rel.level === 'enemy'
                              ? 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800'
                              : rel.level === 'rival'
                                ? 'bg-orange-50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-800'
                                : 'bg-secondary/30 border-border'
                      }`}
                    >
                      <div
                        className="flex items-center gap-4 cursor-pointer"
                        onClick={() => setExpandedPair(isExpanded ? null : pairKey)}
                      >
                        {/* Cat 1 */}
                        <div
                          className="flex items-center gap-2 min-w-0 flex-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            onCatClick?.(rel.catId1);
                          }}
                        >
                          {cat1 && (
                            <CatVisual
                              cat={cat1}
                              size="sm"
                              equippedCostumeId={catCostumes?.[rel.catId1]}
                            />
                          )}
                          <span className="font-medium truncate hover:underline cursor-pointer">
                            {getCatName(rel.catId1)}
                          </span>
                        </div>

                        {/* Relationship Icon */}
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-2xl">{getRelationshipEmoji(rel.level)}</span>
                          <div className="flex items-center gap-1">
                            {/* Warning Badge */}
                            {showWarning && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge
                                    variant="outline"
                                    className={`text-xs gap-0.5 ${getDecayWarningColor(decayInfo.decayLevel)}`}
                                  >
                                    <AlertTriangle className="h-3 w-3" />
                                    {decayInfo.daysSinceInteraction}d
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Last interaction: {decayInfo.daysSinceInteraction} days ago</p>
                                  {decayInfo.isDecaying && (
                                    <p className="text-red-400">
                                      {getDecayWarningText(decayInfo.decayLevel)}
                                    </p>
                                  )}
                                </TooltipContent>
                              </Tooltip>
                            )}
                            <Badge
                              variant="outline"
                              className={`text-xs ${getRelationshipColor(rel.level)}`}
                            >
                              {rel.score > 0 ? '+' : ''}
                              {rel.score}
                            </Badge>
                          </div>
                        </div>

                        {/* Cat 2 */}
                        <div
                          className="flex items-center gap-2 min-w-0 flex-1 justify-end"
                          onClick={(e) => {
                            e.stopPropagation();
                            onCatClick?.(rel.catId2);
                          }}
                        >
                          <span className="font-medium truncate hover:underline cursor-pointer">
                            {getCatName(rel.catId2)}
                          </span>
                          {cat2 && (
                            <CatVisual
                              cat={cat2}
                              size="sm"
                              equippedCostumeId={catCostumes?.[rel.catId2]}
                            />
                          )}
                        </div>
                      </div>

                      {/* Score Bar */}
                      <div className="mt-3 relative h-2 bg-secondary rounded-full overflow-hidden">
                        <div className="absolute inset-y-0 left-1/2 w-0.5 bg-border z-10" />
                        <div
                          className={`absolute inset-y-0 left-0 ${getScoreBarColor(rel.score)} transition-all`}
                          style={{ width: `${getScoreBarWidth(rel.score)}%` }}
                        />
                      </div>

                      {/* Last Interaction Display */}
                      <div className="mt-2 text-xs text-muted-foreground">
                        Last interaction: Day {rel.lastInteraction}(
                        {decayInfo.daysSinceInteraction === 0
                          ? 'Today'
                          : `${decayInfo.daysSinceInteraction} day${decayInfo.daysSinceInteraction > 1 ? 's' : ''} ago`}
                        )
                      </div>

                      {/* Expanded Details */}
                      {isExpanded && pairEvents.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-border/50">
                          <p className="text-xs font-medium text-muted-foreground mb-2">
                            Recent Interactions
                          </p>
                          <div className="space-y-2">
                            {pairEvents.map((event) => (
                              <div
                                key={event.id}
                                className={`text-sm p-2 rounded ${
                                  event.type === 'positive'
                                    ? 'bg-green-100 dark:bg-green-900/30'
                                    : event.type === 'negative'
                                      ? 'bg-red-100 dark:bg-red-900/30'
                                      : 'bg-secondary/50'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span>{event.message}</span>
                                  <span
                                    className={`text-xs ${
                                      event.scoreChange > 0 ? 'text-green-600' : 'text-red-600'
                                    }`}
                                  >
                                    {event.scoreChange > 0 ? '+' : ''}
                                    {event.scoreChange}
                                  </span>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  Day {event.day}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Expand indicator */}
                      <div className="text-center mt-2">
                        <span className="text-xs text-muted-foreground">
                          {isExpanded ? '▲ Click to collapse' : '▼ Click for details'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
