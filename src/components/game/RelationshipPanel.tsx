import { useState } from 'react';
import { Cat } from '@/types/game';
import { 
  CatRelationship, 
  CatGroup, 
  RelationshipEvent,
  getRelationshipEmoji,
  getRelationshipColor,
} from '@/types/relationships';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RelationshipNetworkGraph } from './RelationshipNetworkGraph';
import { CatVisual } from './CatVisual';
interface RelationshipPanelProps {
  cats: Cat[];
  relationships: CatRelationship[];
  groups: CatGroup[];
  events: RelationshipEvent[];
}

export function RelationshipPanel({ cats, relationships, groups, events }: RelationshipPanelProps) {
  const [filter, setFilter] = useState<'all' | 'friends' | 'rivals'>('all');

  const getCatName = (catId: string) => cats.find(c => c.id === catId)?.name || 'Unknown';

  const filteredRelationships = relationships.filter(r => {
    if (filter === 'friends') return r.score >= 20;
    if (filter === 'rivals') return r.score <= -20;
    return true;
  }).sort((a, b) => b.score - a.score);

  const friendCount = relationships.filter(r => r.score >= 20).length;
  const rivalCount = relationships.filter(r => r.score <= -20).length;

  return (
    <Card className="border-accent/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          💗 Cat Relationships
        </CardTitle>
        <div className="flex gap-2 text-xs">
          <Badge variant="secondary" className="bg-green-100 text-green-700">
            💚 {friendCount} Friends
          </Badge>
          <Badge variant="secondary" className="bg-red-100 text-red-700">
            😾 {rivalCount} Rivals
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="relationships" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-3">
            <TabsTrigger value="relationships" className="text-xs">Bonds</TabsTrigger>
            <TabsTrigger value="network" className="text-xs">Network</TabsTrigger>
            <TabsTrigger value="groups" className="text-xs">Groups</TabsTrigger>
            <TabsTrigger value="history" className="text-xs">History</TabsTrigger>
          </TabsList>

          <TabsContent value="relationships" className="mt-0">
            <div className="flex gap-1 mb-3">
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
            </div>

            <ScrollArea className="h-48">
              {filteredRelationships.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No relationships yet. Cats will bond over time!
                </p>
              ) : (
                <div className="space-y-2">
                  {filteredRelationships.map(rel => (
                    <div 
                      key={`${rel.catId1}-${rel.catId2}`}
                      className={`relationship-card p-2 rounded-lg border ${
                        rel.score >= 60 ? 'bg-pink-50 border-pink-200' :
                        rel.score >= 20 ? 'bg-green-50 border-green-200' :
                        rel.score <= -60 ? 'bg-red-50 border-red-200' :
                        rel.score <= -20 ? 'bg-orange-50 border-orange-200' :
                        'bg-secondary/30 border-border'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {cats.find(c => c.id === rel.catId1) && (
                            <CatVisual cat={cats.find(c => c.id === rel.catId1)!} size="xs" />
                          )}
                          <span className="font-medium text-sm">{getCatName(rel.catId1)}</span>
                          <span className={getRelationshipColor(rel.level)}>
                            {getRelationshipEmoji(rel.level)}
                          </span>
                          <span className="font-medium text-sm">{getCatName(rel.catId2)}</span>
                          {cats.find(c => c.id === rel.catId2) && (
                            <CatVisual cat={cats.find(c => c.id === rel.catId2)!} size="xs" />
                          )}
                        </div>
                        <Badge variant="outline" className={`text-xs ${getRelationshipColor(rel.level)}`}>
                          {rel.score > 0 ? '+' : ''}{rel.score}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 capitalize">
                        {rel.level === 'bestFriend' ? 'Best Friends' : rel.level}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="network" className="mt-0">
            <RelationshipNetworkGraph
              cats={cats}
              relationships={relationships}
            />
          </TabsContent>

          <TabsContent value="groups" className="mt-0">
            <ScrollArea className="h-48">
              {groups.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No social groups formed yet. Cats need friendships to form groups!
                </p>
              ) : (
                <div className="space-y-3">
                  {groups.map(group => {
                    const leader = cats.find(c => c.id === group.leaderCatId);
                    return (
                      <div 
                        key={group.id}
                        className={`p-3 rounded-lg border ${
                          group.type === 'friendly' ? 'bg-green-50 border-green-200' :
                          group.type === 'outcasts' ? 'bg-gray-50 border-gray-200' :
                          'bg-orange-50 border-orange-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-sm">{group.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {group.memberIds.length} cats
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {group.memberIds.map(id => {
                            const cat = cats.find(c => c.id === id);
                            const isLeader = id === group.leaderCatId;
                            return (
                              <Badge 
                                key={id} 
                                variant={isLeader ? 'default' : 'secondary'}
                                className="text-xs"
                              >
                                {isLeader && '👑 '}{cat?.name || 'Unknown'}
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
                  {events.slice(0, 20).map(event => (
                    <div 
                      key={event.id}
                      className={`p-2 rounded-lg text-sm ${
                        event.type === 'positive' ? 'bg-green-50 border border-green-200' :
                        event.type === 'negative' ? 'bg-red-50 border border-red-200' :
                        'bg-secondary/30 border border-border'
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
                          {event.scoreChange > 0 ? '+' : ''}{event.scoreChange}
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
