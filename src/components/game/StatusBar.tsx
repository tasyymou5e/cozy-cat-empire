import { GameState, HOUSE_UPGRADES } from '@/types/game';
import { CatRelationship } from '@/types/relationships';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface StatusBarProps {
  state: GameState;
  onUpgrade: () => void;
  onCatShow: () => void;
  relationships?: CatRelationship[];
}

const houseEmojis = {
  apartment: '🏢',
  house: '🏡',
  mansion: '🏰',
  farm: '🌾',
};

export function StatusBar({ state, onUpgrade, onCatShow, relationships = [] }: StatusBarProps) {
  let nextCost: number;
  let canUpgrade: boolean;
  
  if (state.houseSize === 'farm') {
    nextCost = 5000 * (state.acres + 1);
    canUpgrade = state.money >= nextCost && state.acres < 100;
  } else {
    const upgrade = HOUSE_UPGRADES[state.houseSize];
    nextCost = upgrade.cost;
    canUpgrade = state.money >= nextCost;
  }
  
  const eligibleForShow = state.cats.filter(c => c.health >= 70 && c.happiness >= 60).length;

  // Calculate relationship stats
  const friendCount = relationships.filter(r => r.score >= 20).length;
  const rivalCount = relationships.filter(r => r.score <= -20).length;

  return (
    <div className="status-bar">
      <div className="status-grid">
        <div className="status-item">
          <span className="text-2xl">📅</span>
          <div>
            <p className="text-xs text-muted-foreground">Day</p>
            <p className="font-bold">{state.day}</p>
          </div>
        </div>
        
        <div className="status-item highlight">
          <span className="text-2xl">💰</span>
          <div>
            <p className="text-xs text-muted-foreground">Money</p>
            <p className="font-bold text-lg">${state.money}</p>
          </div>
        </div>
        
        <div className="status-item">
          <span className="text-2xl">🐱</span>
          <div>
            <p className="text-xs text-muted-foreground">Cats</p>
            <p className="font-bold">{state.cats.length}/{state.space}</p>
          </div>
          <Progress value={(state.cats.length / state.space) * 100} className="w-16 h-1.5 mt-1" />
        </div>
        
        <div className="status-item">
          <span className="text-2xl">{houseEmojis[state.houseSize]}</span>
          <div>
            <p className="text-xs text-muted-foreground">Home</p>
            <p className="font-bold capitalize">
              {state.houseSize}
              {state.houseSize === 'farm' && ` (${state.acres}/100 ac)`}
            </p>
          </div>
          <Button 
            size="sm" 
            variant={canUpgrade ? 'default' : 'outline'}
            onClick={onUpgrade}
            disabled={!canUpgrade}
            className="ml-2 text-xs h-7"
          >
            ${nextCost}
          </Button>
        </div>
        
        <div className="status-item">
          <span className="text-2xl">🏆</span>
          <div>
            <p className="text-xs text-muted-foreground">Show Wins</p>
            <p className="font-bold">{state.totalShowWins}</p>
          </div>
        </div>
        
        <div className="status-item">
          <span className="text-2xl">💗</span>
          <div>
            <p className="text-xs text-muted-foreground">Social</p>
            <div className="flex gap-1">
              <Badge variant="outline" className="text-xs bg-green-50 text-green-600 border-green-200 px-1">
                💚{friendCount}
              </Badge>
              <Badge variant="outline" className="text-xs bg-red-50 text-red-600 border-red-200 px-1">
                😾{rivalCount}
              </Badge>
            </div>
          </div>
        </div>
      </div>
      
      <div className="status-actions">
        <Button 
          onClick={onCatShow}
          disabled={eligibleForShow === 0}
          className="cat-show-button"
        >
          🎪 Enter Cat Show ({eligibleForShow} eligible)
        </Button>
      </div>
    </div>
  );
}
