import { Cat } from '@/types/game';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

interface CatCardProps {
  cat: Cat;
  onSell: (id: string) => void;
}

const catEmojis = {
  stray: '🐱',
  adopted: '😺',
  pure: '😻',
};

const typeColors = {
  stray: 'bg-muted',
  adopted: 'bg-accent',
  pure: 'bg-primary/10',
};

export function CatCard({ cat, onSell }: CatCardProps) {
  return (
    <div className={`cat-card ${typeColors[cat.type]}`}>
      <div className="text-4xl mb-2">{catEmojis[cat.type]}</div>
      <h3 className="font-bold text-foreground">{cat.name}</h3>
      <span className="text-xs text-muted-foreground capitalize mb-3">{cat.type}</span>
      
      <div className="w-full space-y-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs w-6">❤️</span>
          <Progress value={cat.health} className="h-2 flex-1" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs w-6">😊</span>
          <Progress value={cat.happiness} className="h-2 flex-1" />
        </div>
      </div>
      
      <div className="flex items-center justify-between w-full">
        <span className="text-sm font-medium text-primary">${cat.value}</span>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => onSell(cat.id)}
          className="text-xs hover:bg-destructive/10 hover:text-destructive"
        >
          Sell
        </Button>
      </div>
    </div>
  );
}
