import { useMemo } from 'react';
import { Cat } from '@/types/game';
import { 
  CatRelationship, 
  RelationshipLevel,
  getRelationshipEmoji,
  getRelationshipColor,
  PERSONALITY_COMPATIBILITY,
} from '@/types/relationships';
import { CatVisual } from './CatVisual';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Heart, HeartCrack, Users, Sparkles, TrendingUp, TrendingDown } from 'lucide-react';

interface CatSocialProfileProps {
  cat: Cat;
  allCats: Cat[];
  relationships: CatRelationship[];
  catCostumes?: Record<string, string>;
  onCatClick?: (catId: string) => void;
}

export function CatSocialProfile({
  cat,
  allCats,
  relationships,
  catCostumes,
  onCatClick,
}: CatSocialProfileProps) {
  // Get all relationships for this cat
  const catRelationships = useMemo(() => {
    return relationships
      .filter(r => r.catId1 === cat.id || r.catId2 === cat.id)
      .map(r => ({
        ...r,
        otherCatId: r.catId1 === cat.id ? r.catId2 : r.catId1,
      }))
      .sort((a, b) => b.score - a.score);
  }, [relationships, cat.id]);

  // Calculate stats
  const stats = useMemo(() => {
    const friends = catRelationships.filter(r => r.level === 'friend' || r.level === 'bestFriend');
    const enemies = catRelationships.filter(r => r.level === 'enemy' || r.level === 'rival');
    const bestFriend = catRelationships.find(r => r.level === 'bestFriend');
    const worstEnemy = catRelationships.find(r => r.level === 'enemy');
    
    const avgScore = catRelationships.length > 0
      ? catRelationships.reduce((sum, r) => sum + r.score, 0) / catRelationships.length
      : 0;

    // Calculate happiness modifier based on relationships
    const friendBonus = friends.length * 2;
    const enemyPenalty = enemies.length * 3;
    const happinessModifier = Math.max(-20, Math.min(20, friendBonus - enemyPenalty));

    return {
      totalRelationships: catRelationships.length,
      friendCount: friends.length,
      enemyCount: enemies.length,
      bestFriend,
      worstEnemy,
      avgScore,
      happinessModifier,
    };
  }, [catRelationships]);

  // Calculate breeding compatibility with other cats
  const compatibilityList = useMemo(() => {
    return allCats
      .filter(c => c.id !== cat.id)
      .map(otherCat => {
        const relationship = catRelationships.find(r => r.otherCatId === otherCat.id);
        const personalityBonus = PERSONALITY_COMPATIBILITY[cat.personality]?.[otherCat.personality] || 0;
        const relationshipBonus = relationship ? relationship.score / 10 : 0;
        const compatibility = Math.min(100, Math.max(0, 50 + personalityBonus + relationshipBonus));
        
        return {
          cat: otherCat,
          compatibility,
          relationship,
          personalityBonus,
        };
      })
      .sort((a, b) => b.compatibility - a.compatibility);
  }, [allCats, cat, catRelationships]);

  const getCatName = (catId: string) => allCats.find(c => c.id === catId)?.name || 'Unknown';
  const getCat = (catId: string) => allCats.find(c => c.id === catId);

  const bestFriendCat = stats.bestFriend ? getCat(stats.bestFriend.otherCatId) : null;
  const worstEnemyCat = stats.worstEnemy ? getCat(stats.worstEnemy.otherCatId) : null;

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-4">
          <CatVisual cat={cat} size="lg" equippedCostumeId={catCostumes?.[cat.id]} />
          <div>
            <CardTitle className="text-xl">{cat.name}'s Social Profile</CardTitle>
            <p className="text-sm text-muted-foreground capitalize">
              {cat.personality} {cat.breed}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[420px]">
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-secondary/50 rounded-lg p-3 text-center">
                <Users className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                <p className="text-xl font-bold">{stats.totalRelationships}</p>
                <p className="text-xs text-muted-foreground">Connections</p>
              </div>
              <div className="bg-green-100 dark:bg-green-950/30 rounded-lg p-3 text-center">
                <Heart className="h-5 w-5 mx-auto mb-1 text-green-600" />
                <p className="text-xl font-bold text-green-600">{stats.friendCount}</p>
                <p className="text-xs text-muted-foreground">Friends</p>
              </div>
              <div className="bg-red-100 dark:bg-red-950/30 rounded-lg p-3 text-center">
                <HeartCrack className="h-5 w-5 mx-auto mb-1 text-red-600" />
                <p className="text-xl font-bold text-red-600">{stats.enemyCount}</p>
                <p className="text-xs text-muted-foreground">Enemies</p>
              </div>
              <div className={`rounded-lg p-3 text-center ${
                stats.happinessModifier >= 0 
                  ? 'bg-green-100 dark:bg-green-950/30' 
                  : 'bg-red-100 dark:bg-red-950/30'
              }`}>
                {stats.happinessModifier >= 0 
                  ? <TrendingUp className="h-5 w-5 mx-auto mb-1 text-green-600" />
                  : <TrendingDown className="h-5 w-5 mx-auto mb-1 text-red-600" />
                }
                <p className={`text-xl font-bold ${
                  stats.happinessModifier >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stats.happinessModifier > 0 ? '+' : ''}{stats.happinessModifier}
                </p>
                <p className="text-xs text-muted-foreground">Happiness</p>
              </div>
            </div>

            {/* Best Friend & Worst Enemy */}
            <div className="grid sm:grid-cols-2 gap-4">
              {bestFriendCat ? (
                <div 
                  className="bg-pink-50 dark:bg-pink-950/20 border border-pink-200 dark:border-pink-800 rounded-lg p-4 cursor-pointer hover:bg-pink-100 dark:hover:bg-pink-950/30 transition-colors"
                  onClick={() => onCatClick?.(bestFriendCat.id)}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">💕</span>
                    <span className="font-medium text-pink-700 dark:text-pink-400">Best Friend</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CatVisual cat={bestFriendCat} size="sm" equippedCostumeId={catCostumes?.[bestFriendCat.id]} />
                    <div>
                      <p className="font-medium">{bestFriendCat.name}</p>
                      <Badge variant="outline" className="text-xs text-pink-600">
                        +{stats.bestFriend?.score}
                      </Badge>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-secondary/30 border border-border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">💕</span>
                    <span className="font-medium text-muted-foreground">Best Friend</span>
                  </div>
                  <p className="text-sm text-muted-foreground">No best friend yet</p>
                </div>
              )}

              {worstEnemyCat ? (
                <div 
                  className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4 cursor-pointer hover:bg-red-100 dark:hover:bg-red-950/30 transition-colors"
                  onClick={() => onCatClick?.(worstEnemyCat.id)}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">💔</span>
                    <span className="font-medium text-red-700 dark:text-red-400">Worst Enemy</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CatVisual cat={worstEnemyCat} size="sm" equippedCostumeId={catCostumes?.[worstEnemyCat.id]} />
                    <div>
                      <p className="font-medium">{worstEnemyCat.name}</p>
                      <Badge variant="outline" className="text-xs text-red-600">
                        {stats.worstEnemy?.score}
                      </Badge>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-secondary/30 border border-border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">💔</span>
                    <span className="font-medium text-muted-foreground">Worst Enemy</span>
                  </div>
                  <p className="text-sm text-muted-foreground">No enemies</p>
                </div>
              )}
            </div>

            {/* All Relationships */}
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Users className="h-4 w-4" />
                All Relationships ({catRelationships.length})
              </h4>
              {catRelationships.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No relationships formed yet
                </p>
              ) : (
                <div className="space-y-2">
                  {catRelationships.map(rel => {
                    const otherCat = getCat(rel.otherCatId);
                    if (!otherCat) return null;
                    
                    return (
                      <div 
                        key={rel.otherCatId}
                        className="flex items-center gap-3 p-2 rounded-lg bg-secondary/30 hover:bg-secondary/50 cursor-pointer transition-colors"
                        onClick={() => onCatClick?.(rel.otherCatId)}
                      >
                        <CatVisual cat={otherCat} size="xs" equippedCostumeId={catCostumes?.[otherCat.id]} />
                        <span className="font-medium flex-1">{otherCat.name}</span>
                        <span>{getRelationshipEmoji(rel.level)}</span>
                        <Badge variant="outline" className={`text-xs ${getRelationshipColor(rel.level)}`}>
                          {rel.score > 0 ? '+' : ''}{rel.score}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Breeding Compatibility */}
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Breeding Compatibility
              </h4>
              <div className="space-y-2">
                {compatibilityList.slice(0, 5).map(({ cat: otherCat, compatibility, personalityBonus }) => (
                  <div 
                    key={otherCat.id}
                    className="flex items-center gap-3 p-2 rounded-lg bg-secondary/30"
                  >
                    <CatVisual cat={otherCat} size="xs" equippedCostumeId={catCostumes?.[otherCat.id]} />
                    <span className="font-medium flex-1">{otherCat.name}</span>
                    <div className="flex items-center gap-2 w-32">
                      <Progress value={compatibility} className="h-2" />
                      <span className="text-xs font-medium w-10">{Math.round(compatibility)}%</span>
                    </div>
                    {personalityBonus > 10 && (
                      <Badge variant="outline" className="text-xs bg-green-100 text-green-700">
                        Great match
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
