import { Cat, BREEDS } from '@/types/game';
import { CatRelationship, getRelationshipEmoji, getRelationshipLevel } from '@/types/relationships';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface CatCardProps {
  cat: Cat;
  onSell: (id: string) => void;
  onHeal: (id: string) => void;
  compact?: boolean;
  relationships?: CatRelationship[];
  allCats?: Cat[];
}

const catEmojis: Record<string, string> = {
  'stray': '🐱',
  'tabby': '🐈',
  'persian': '😺',
  'siamese': '😸',
  'maine-coon': '🦁',
  'british-shorthair': '😻',
  'ragdoll': '🐾',
  'bengal': '🐆',
};

const personalityEmojis: Record<string, string> = {
  'lazy': '😴',
  'playful': '🎾',
  'affectionate': '💕',
  'independent': '😎',
  'curious': '🔍',
  'shy': '🙈',
};

export function CatCard({ cat, onSell, onHeal, compact = false, relationships = [], allCats = [] }: CatCardProps) {
  const breedInfo = BREEDS[cat.breed];
  const isHealthy = cat.health >= 70;
  const isHappy = cat.happiness >= 60;
  const isHungry = cat.hunger < 40;

  // Get this cat's relationships
  const catRelationships = relationships.filter(
    r => r.catId1 === cat.id || r.catId2 === cat.id
  );
  
  const friends = catRelationships.filter(r => r.score >= 20);
  const enemies = catRelationships.filter(r => r.score <= -20);
  const bestFriends = catRelationships.filter(r => r.score >= 60);

  const getCatName = (catId: string) => {
    const otherCat = allCats.find(c => c.id === catId);
    return otherCat?.name || 'Unknown';
  };

  const getOtherId = (rel: CatRelationship) => 
    rel.catId1 === cat.id ? rel.catId2 : rel.catId1;

  if (compact) {
    return (
      <div className="cat-card-compact">
        <span className="text-2xl">{catEmojis[cat.breed]}</span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{cat.name}</p>
          <p className="text-xs text-muted-foreground">{breedInfo.name}</p>
        </div>
        <div className="flex gap-1">
          {!isHealthy && <span className="text-red-500">💔</span>}
          {isHungry && <span>🍖</span>}
          {cat.showWins > 0 && <span>🏆{cat.showWins}</span>}
          {friends.length > 0 && <span className="text-green-500">💚{friends.length}</span>}
          {enemies.length > 0 && <span className="text-red-500">😾{enemies.length}</span>}
        </div>
      </div>
    );
  }

  return (
    <div className={`cat-card ${!isHealthy ? 'border-destructive/50' : ''}`}>
      <div className="flex items-start justify-between w-full mb-2">
        <div className="text-3xl">{catEmojis[cat.breed]}</div>
        <div className="flex gap-1">
          <Badge variant={cat.type === 'pure' ? 'default' : 'secondary'} className="text-xs">
            {cat.type}
          </Badge>
        </div>
      </div>
      
      <h3 className="font-bold text-foreground">{cat.name}</h3>
      <p className="text-xs text-muted-foreground mb-1">{breedInfo.name}</p>
      <p className="text-xs text-muted-foreground mb-2">
        {personalityEmojis[cat.personality]} {cat.personality}
      </p>

      {/* Relationship Badges */}
      {(friends.length > 0 || enemies.length > 0) && (
        <TooltipProvider>
          <div className="flex gap-1 flex-wrap mb-2 w-full">
            {bestFriends.length > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="text-xs bg-pink-50 text-pink-600 border-pink-200 cursor-help">
                    💕 {bestFriends.length}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Best friends with: {bestFriends.map(r => getCatName(getOtherId(r))).join(', ')}</p>
                </TooltipContent>
              </Tooltip>
            )}
            {friends.length > bestFriends.length && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="text-xs bg-green-50 text-green-600 border-green-200 cursor-help">
                    💚 {friends.length - bestFriends.length}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Friends with: {friends.filter(r => r.score < 60).map(r => getCatName(getOtherId(r))).join(', ')}</p>
                </TooltipContent>
              </Tooltip>
            )}
            {enemies.length > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="text-xs bg-red-50 text-red-600 border-red-200 cursor-help">
                    😾 {enemies.length}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Rivals with: {enemies.map(r => getCatName(getOtherId(r))).join(', ')}</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </TooltipProvider>
      )}
      
      <div className="w-full space-y-1.5 mb-3">
        <div className="stat-row">
          <span className="text-xs">❤️ Health</span>
          <Progress value={cat.health} className={`h-1.5 flex-1 ${cat.health < 50 ? 'bg-destructive/20' : ''}`} />
        </div>
        <div className="stat-row">
          <span className="text-xs">😊 Happy</span>
          <Progress value={cat.happiness} className="h-1.5 flex-1" />
        </div>
        <div className="stat-row">
          <span className="text-xs">🍖 Hunger</span>
          <Progress value={cat.hunger} className={`h-1.5 flex-1 ${cat.hunger < 30 ? 'bg-amber-500/30' : ''}`} />
        </div>
      </div>
      
      <div className="flex items-center gap-2 w-full text-xs text-muted-foreground mb-2">
        {cat.showWins > 0 && <span>🏆 {cat.showWins} wins</span>}
        <span className="ml-auto font-medium text-primary">${cat.value}</span>
      </div>
      
      <div className="flex gap-1 w-full">
        {!isHealthy && (
          <Button variant="outline" size="sm" onClick={() => onHeal(cat.id)} className="flex-1 text-xs">
            💊 Heal
          </Button>
        )}
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => onSell(cat.id)}
          className="flex-1 text-xs hover:bg-destructive/10 hover:text-destructive"
        >
          Sell
        </Button>
      </div>
    </div>
  );
}
