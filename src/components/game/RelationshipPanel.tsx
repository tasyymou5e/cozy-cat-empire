import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Cat } from '@/types/game';
import {
  CatRelationship,
  CatGroup,
  RelationshipEvent,
  getRelationshipEmoji,
  getRelationshipColor,
  getDecayInfo,
  getDecayWarningColor,
  getDecayWarningText,
} from '@/types/relationships';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CatVisual } from './CatVisual';
import { RelationshipNetworkGraph } from './RelationshipNetworkGraph';
import { SocialCalendarPanel } from './SocialCalendarPanel';
import { ExternalLink, AlertTriangle, Flame } from 'lucide-react';

interface RelationshipPanelProps {
  cats: Cat[];
  relationships: CatRelationship[];
  groups: CatGroup[];
  events: RelationshipEvent[];
  catCostumes?: Record<string, string>;
  currentDay?: number;
  maintenanceStreak?: number;
  needsAttentionCount?: number;
  /** Callback to navigate to Socialize panel with pre-selected cats */
  onQuickSocialize?: (cat1Id: string, cat2Id: string) => void;
}

export function RelationshipPanel({
  cats,
  relationships,
  groups,
  events,
  catCostumes,
  currentDay = 1,
  maintenanceStreak = 0,
  needsAttentionCount = 0,
  onQuickSocialize,
}: RelationshipPanelProps) {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'friends' | 'rivals' | 'needs-attention'>('all');

  const getCatName = (catId: string) => cats.find((c) => c.id === catId)?.name || 'Unknown';

  const filteredRelationships = relationships
    .filter((r) => {
      if (filter === 'friends') return r.score >= 20;
      if (filter === 'rivals') return r.score <= -20;
      if (filter === 'needs-attention') {
        const decayInfo = getDecayInfo(r, currentDay);
        return decayInfo.daysSinceInteraction >= 2;
      }
      return true;
    })
    .sort((a, b) => b.score - a.score);

  const friendCount = relationships.filter((r) => r.score >= 20).length;
  const rivalCount = relationships.filter((r) => r.score <= -20).length;

  return (
    <Card className="border-accent/30">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">💗 Cat Relationships</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/relationships')}
            className="text-xs gap-1 h-7"
          >
            <ExternalLink className="h-3 w-3" />
            View Full
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <Badge
            variant="secondary"
            className="bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400"
          >
            💚 {friendCount} Friends
          </Badge>
          <Badge
            variant="secondary"
            className="bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400"
          >
            😾 {rivalCount} Rivals
          </Badge>
          {maintenanceStreak > 0 && (
            <Badge
              variant="secondary"
              className="bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-400 gap-1"
            >
              <Flame className="h-3 w-3" />
              {maintenanceStreak} day streak
            </Badge>
          )}
          {needsAttentionCount > 0 && (
            <Badge variant="destructive" className="gap-1">
              <AlertTriangle className="h-3 w-3" />
              {needsAttentionCount} need attention
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="relationships" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-3">
            <TabsTrigger value="relationships" className="text-xs">
              Bonds
            </TabsTrigger>
            <TabsTrigger value="calendar" className="text-xs">
              Calendar
            </TabsTrigger>
            <TabsTrigger value="network" className="text-xs">
              Network
            </TabsTrigger>
            <TabsTrigger value="groups" className="text-xs">
              Groups
            </TabsTrigger>
            <TabsTrigger value="history" className="text-xs">
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="relationships" className="mt-0">
            <div className="flex flex-wrap gap-1 mb-3">
              <Badge
                variant={filter === 'all' ? 'default' : 'outline'}
                className="cursor-pointer text-xs"
                onClick={() => setFilter('all')}
              >
                All
              </Badge>
              <Badge
                variant={filter === 'friends' ? 'default' : 'outline'}
                className="cursor-pointer text-xs"
                onClick={() => setFilter('friends')}
              >
                Friends
              </Badge>
              <Badge
                variant={filter === 'rivals' ? 'default' : 'outline'}
                className="cursor-pointer text-xs"
                onClick={() => setFilter('rivals')}
              >
                Rivals
              </Badge>
              <Badge
                variant={filter === 'needs-attention' ? 'default' : 'outline'}
                className="cursor-pointer text-xs gap-1"
                onClick={() => setFilter('needs-attention')}
              >
                <AlertTriangle className="h-3 w-3" />
                Needs Attention
              </Badge>
            </div>

            <ScrollArea className="h-48">
              {filteredRelationships.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {filter === 'needs-attention'
                    ? 'All relationships are healthy! 🎉'
                    : 'No relationships yet. Cats will bond over time!'}
                </p>
              ) : (
                <TooltipProvider>
                  <div className="space-y-2">
                    {filteredRelationships.map((rel) => {
                      const decayInfo = getDecayInfo(rel, currentDay);
                      const showWarning = decayInfo.daysSinceInteraction >= 2;

                      return (
                        <div
                          key={`${rel.catId1}-${rel.catId2}`}
                          className={`relationship-card p-2 rounded-lg border ${
                            rel.score >= 60
                              ? 'bg-pink-50 border-pink-200 dark:bg-pink-950/20 dark:border-pink-800'
                              : rel.score >= 20
                                ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800'
                                : rel.score <= -60
                                  ? 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800'
                                  : rel.score <= -20
                                    ? 'bg-orange-50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-800'
                                    : 'bg-secondary/30 border-border'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              {cats.find((c) => c.id === rel.catId1) && (
                                <CatVisual
                                  cat={cats.find((c) => c.id === rel.catId1)!}
                                  size="xs"
                                  equippedCostumeId={catCostumes?.[rel.catId1]}
                                />
                              )}
                              <span className="font-medium text-sm truncate">
                                {getCatName(rel.catId1)}
                              </span>
                              <span className={getRelationshipColor(rel.level)}>
                                {getRelationshipEmoji(rel.level)}
                              </span>
                              <span className="font-medium text-sm truncate">
                                {getCatName(rel.catId2)}
                              </span>
                              {cats.find((c) => c.id === rel.catId2) && (
                                <CatVisual
                                  cat={cats.find((c) => c.id === rel.catId2)!}
                                  size="xs"
                                  equippedCostumeId={catCostumes?.[rel.catId2]}
                                />
                              )}
                            </div>
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
                                    <p>
                                      Last interaction: {decayInfo.daysSinceInteraction} days ago
                                    </p>
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
                          {/* Last Interaction Display */}
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-xs text-muted-foreground capitalize">
                              {rel.level === 'bestFriend' ? 'Best Friends' : rel.level}
                            </p>
                            <span className="text-xs text-muted-foreground">
                              {decayInfo.daysSinceInteraction === 0
                                ? 'Played today'
                                : `${decayInfo.daysSinceInteraction} day${decayInfo.daysSinceInteraction > 1 ? 's' : ''} ago`}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </TooltipProvider>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="calendar" className="mt-0">
            <SocialCalendarPanel
              cats={cats}
              relationships={relationships}
              currentDay={currentDay}
              catCostumes={catCostumes}
              onQuickSocialize={onQuickSocialize}
            />
          </TabsContent>

          <TabsContent value="network" className="mt-0">
            <RelationshipNetworkGraph cats={cats} relationships={relationships} />
          </TabsContent>

          <TabsContent value="groups" className="mt-0">
            <ScrollArea className="h-48">
              {groups.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No social groups formed yet. Cats need friendships to form groups!
                </p>
              ) : (
                <div className="space-y-3">
                  {groups.map((group) => {
                    const leader = cats.find((c) => c.id === group.leaderCatId);
                    return (
                      <div
                        key={group.id}
                        className={`p-3 rounded-lg border ${
                          group.type === 'friendly'
                            ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800'
                            : group.type === 'outcasts'
                              ? 'bg-muted/30 border-border'
                              : 'bg-orange-50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-800'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-sm">{group.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {group.memberIds.length} cats
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {group.memberIds.map((id) => {
                            const cat = cats.find((c) => c.id === id);
                            const isLeader = id === group.leaderCatId;
                            return (
                              <Badge
                                key={id}
                                variant={isLeader ? 'default' : 'secondary'}
                                className="text-xs"
                              >
                                {isLeader && '👑 '}
                                {cat?.name || 'Unknown'}
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="history" className="mt-0">
            <ScrollArea className="h-48">
              {events.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No interactions recorded yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {events.slice(0, 20).map((event) => (
                    <div
                      key={event.id}
                      className={`p-2 rounded-lg text-sm ${
                        event.type === 'positive'
                          ? 'bg-green-50 border border-green-200 dark:bg-green-950/20 dark:border-green-800'
                          : event.type === 'negative'
                            ? 'bg-red-50 border border-red-200 dark:bg-red-950/20 dark:border-red-800'
                            : 'bg-secondary/30 border border-border'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{event.message}</span>
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            event.scoreChange > 0 ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {event.scoreChange > 0 ? '+' : ''}
                          {event.scoreChange}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">Day {event.day}</span>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
