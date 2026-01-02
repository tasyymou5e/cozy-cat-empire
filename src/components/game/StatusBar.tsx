import { GameState } from '@/types/game';

interface StatusBarProps {
  state: GameState;
}

const houseEmojis = {
  apartment: '🏢',
  house: '🏡',
  farm: '🌾',
};

export function StatusBar({ state }: StatusBarProps) {
  return (
    <div className="status-bar">
      <div className="status-item">
        <span className="text-2xl">📅</span>
        <div>
          <p className="text-xs text-muted-foreground">Day</p>
          <p className="font-bold text-foreground">{state.day}</p>
        </div>
      </div>
      
      <div className="status-item">
        <span className="text-2xl">💰</span>
        <div>
          <p className="text-xs text-muted-foreground">Money</p>
          <p className="font-bold text-foreground">${state.money}</p>
        </div>
      </div>
      
      <div className="status-item">
        <span className="text-2xl">🐱</span>
        <div>
          <p className="text-xs text-muted-foreground">Cats</p>
          <p className="font-bold text-foreground">{state.cats.length}/{state.space}</p>
        </div>
      </div>
      
      <div className="status-item">
        <span className="text-2xl">{houseEmojis[state.houseSize]}</span>
        <div>
          <p className="text-xs text-muted-foreground">Home</p>
          <p className="font-bold text-foreground capitalize">
            {state.houseSize}
            {state.houseSize === 'farm' && ` (${state.acres}ac)`}
          </p>
        </div>
      </div>
    </div>
  );
}
