import { Cat } from '@/types/game';
import { CatGroup } from '@/types/relationships';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users } from 'lucide-react';

interface GroupActivitiesPanelProps {
  cats: Cat[];
  groups: CatGroup[];
  treats: number;
  toys: number;
  onGroupActivity: (groupId: string, activityType: 'play' | 'treat' | 'nap') => void;
}

const ACTIVITIES = [
  { id: 'play', name: 'Group Playtime', emoji: '🎾', cost: { toys: 1, treats: 0 }, happinessBonus: 10, relationshipBonus: 5 },
  { id: 'treat', name: 'Treat Party', emoji: '🍬', cost: { toys: 0, treats: 2 }, happinessBonus: 8, relationshipBonus: 8 },
  { id: 'nap', name: 'Group Nap', emoji: '😴', cost: { toys: 0, treats: 0 }, happinessBonus: 5, relationshipBonus: 3 },
];

export function GroupActivitiesPanel({ cats, groups, treats, toys, onGroupActivity }: GroupActivitiesPanelProps) {
  const friendlyGroups = groups.filter(g => g.type === 'friendly');

  const canAfford = (activity: typeof ACTIVITIES[0]) => {
    return toys >= activity.cost.toys && treats >= activity.cost.treats;
  };

  return (
    <Card className="border-accent/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Group Activities
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Cats in cliques can do activities together for bonus happiness!
        </p>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-64">
          {friendlyGroups.length === 0 ? (
            <div className="text-center py-6">
              <span className="text-4xl mb-2 block">🐱</span>
              <p className="text-sm text-muted-foreground">
                No cat cliques formed yet. Socialize cats to form friend groups!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {friendlyGroups.map(group => {
                const memberCats = group.memberIds.map(id => cats.find(c => c.id === id)).filter(Boolean) as Cat[];
                const leaderCat = cats.find(c => c.id === group.leaderCatId);
                
                return (
                  <div key={group.id} className="p-3 rounded-lg border border-green-200 bg-green-50/50">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="font-semibold text-sm">{group.name}</span>
                        <Badge variant="outline" className="ml-2 text-xs">
                          👑 {leaderCat?.name}
                        </Badge>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {memberCats.length} cats
                      </Badge>
                    </div>
                    
                    <div className="flex flex-wrap gap-1 mb-3">
                      {memberCats.map(cat => (
                        <Badge key={cat.id} variant="outline" className="text-xs">
                          {cat.name}
                        </Badge>
                      ))}
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2">
                      {ACTIVITIES.map(activity => (
                        <Button
                          key={activity.id}
                          variant="outline"
                          size="sm"
                          disabled={!canAfford(activity)}
                          onClick={() => onGroupActivity(group.id, activity.id as 'play' | 'treat' | 'nap')}
                          className="flex flex-col h-auto py-2 text-xs"
                        >
                          <span className="text-lg">{activity.emoji}</span>
                          <span className="text-xs">{activity.name.split(' ')[1]}</span>
                          {activity.cost.toys > 0 && <span className="text-xs text-muted-foreground">🎾{activity.cost.toys}</span>}
                          {activity.cost.treats > 0 && <span className="text-xs text-muted-foreground">🍬{activity.cost.treats}</span>}
                        </Button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
