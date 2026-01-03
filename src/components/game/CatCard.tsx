import { Cat, BREEDS } from '@/types/game';
import { CatRelationship } from '@/types/relationships';
import { getGradeBorderClass } from '@/types/grading';
import { GradeBadge } from './GradeBadge';
import { CatAvatar } from './CatAvatar';
import { ComfortButton } from './ComfortButton';
import { CatCardReaction } from './CatCardReaction';
import { CatReaction } from '@/contexts/CatReactionContext';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
interface CatCardProps {
  cat: Cat;
  onSell: (id: string) => void;
  onHeal: (id: string) => void;
  onComfort?: (id: string) => void;
  compact?: boolean;
  relationships?: CatRelationship[];
  allCats?: Cat[];
  equippedCostumeId?: string;
  reaction?: CatReaction;
}

const personalityEmojis: Record<string, string> = {
  'lazy': '😴', 'playful': '🎾', 'affectionate': '💕',
  'independent': '😎', 'curious': '🔍', 'shy': '🙈',
};

export function CatCard({ cat, onSell, onHeal, onComfort, compact = false, relationships = [], allCats = [], equippedCostumeId, reaction }: CatCardProps) {
  const breedInfo = BREEDS[cat.breed];
  const isHealthy = cat.health >= 70;
  const gradeBorder = getGradeBorderClass(cat.grade);
  
  const glowColor = reaction?.type === 'positive' 
    ? 'rgba(236, 72, 153, 0.4)' 
    : reaction?.type === 'negative' 
    ? 'rgba(239, 68, 68, 0.4)' 
    : undefined;
  const catRelationships = relationships.filter(r => r.catId1 === cat.id || r.catId2 === cat.id);
  const friends = catRelationships.filter(r => r.score >= 20);
  const enemies = catRelationships.filter(r => r.score <= -20);

  // Check if cat needs comforting (upset, angry, sad)
  const needsComfort = cat.happiness < 50 || enemies.length > friends.length || cat.health < 50;
  const moodEmoji = cat.happiness < 30 ? '😿' : cat.happiness < 50 ? '😾' : null;

  if (compact) {
    return (
      <div className="cat-card-compact">
        <CatAvatar cat={cat} size="sm" equippedCostumeId={equippedCostumeId} />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{cat.name}</p>
          <p className="text-xs text-muted-foreground">{breedInfo.name}</p>
        </div>
        <GradeBadge grade={cat.grade} size="sm" />
      </div>
    );
  }

  return (
    <div 
      className={`cat-card ${gradeBorder} ${!isHealthy ? 'border-destructive/50' : ''} ${reaction ? 'animate-card-glow' : ''} relative overflow-visible`}
      style={glowColor ? { '--glow-color': glowColor } as React.CSSProperties : undefined}
    >
      {reaction && <CatCardReaction reaction={reaction} />}
      <div className="flex items-start justify-between w-full mb-2">
        <div className="flex items-center gap-1">
          <CatAvatar cat={cat} size="md" equippedCostumeId={equippedCostumeId} animated />
          {moodEmoji && <span className="text-lg">{moodEmoji}</span>}
        </div>
        <GradeBadge grade={cat.grade} />
      </div>
      
      <h3 className="font-bold text-foreground">{cat.name}</h3>
      <p className="text-xs text-muted-foreground mb-1">{breedInfo.name}</p>
      <p className="text-xs text-muted-foreground mb-2">
        {personalityEmojis[cat.personality]} {cat.personality}
      </p>

      {/* Relationship Badges */}
      {(friends.length > 0 || enemies.length > 0) && (
        <div className="flex gap-1 flex-wrap mb-2 w-full">
          {friends.length > 0 && (
            <Badge variant="outline" className="text-xs bg-green-50 text-green-600 border-green-200">
              💚 {friends.length}
            </Badge>
          )}
          {enemies.length > 0 && (
            <Badge variant="outline" className="text-xs bg-red-50 text-red-600 border-red-200">
              😾 {enemies.length}
            </Badge>
          )}
          {cat.tricksLearned.length > 0 && (
            <Badge variant="outline" className="text-xs bg-purple-50 text-purple-600 border-purple-200">
              🎯 {cat.tricksLearned.length} tricks
            </Badge>
          )}
        </div>
      )}
      
      <div className="w-full space-y-1.5 mb-3">
        <div className="stat-row">
          <span className="text-xs">❤️</span>
          <Progress value={cat.health} className={`h-1.5 flex-1 ${cat.health < 50 ? 'bg-destructive/20' : ''}`} />
        </div>
        <div className="stat-row">
          <span className="text-xs">😊</span>
          <Progress value={cat.happiness} className={`h-1.5 flex-1 ${cat.happiness < 50 ? 'bg-amber-500/30' : ''}`} />
        </div>
        <div className="stat-row">
          <span className="text-xs">🍖</span>
          <Progress value={cat.hunger} className={`h-1.5 flex-1 ${cat.hunger < 30 ? 'bg-amber-500/30' : ''}`} />
        </div>
      </div>
      
      <div className="flex items-center gap-2 w-full text-xs text-muted-foreground mb-2">
        {cat.showWins > 0 && <span>🏆 {cat.showWins}</span>}
        <span className="ml-auto font-medium text-primary">${cat.value}</span>
      </div>
      
      {/* Comfort button for upset cats */}
      {needsComfort && onComfort && (
        <div className="w-full mb-2">
          <ComfortButton catId={cat.id} catName={cat.name} onComfort={onComfort} />
        </div>
      )}
      
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
