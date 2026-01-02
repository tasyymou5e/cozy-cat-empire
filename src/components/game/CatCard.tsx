import { Cat, BREEDS } from '@/types/game';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface CatCardProps {
  cat: Cat;
  onSell: (id: string) => void;
  onHeal: (id: string) => void;
  compact?: boolean;
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

export function CatCard({ cat, onSell, onHeal, compact = false }: CatCardProps) {
  const breedInfo = BREEDS[cat.breed];
  const isHealthy = cat.health >= 70;
  const isHappy = cat.happiness >= 60;
  const isHungry = cat.hunger < 40;

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
        </div>
      </div>
    );
  }

  return (
    <div className={`cat-card ${!isHealthy ? 'border-destructive/50' : ''}`}>
      <div className="flex items-start justify-between w-full mb-2">
        <div className="text-3xl">{catEmojis[cat.breed]}</div>
        <Badge variant={cat.type === 'pure' ? 'default' : 'secondary'} className="text-xs">
          {cat.type}
        </Badge>
      </div>
      
      <h3 className="font-bold text-foreground">{cat.name}</h3>
      <p className="text-xs text-muted-foreground mb-1">{breedInfo.name}</p>
      <p className="text-xs text-muted-foreground mb-3">
        {personalityEmojis[cat.personality]} {cat.personality}
      </p>
      
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
