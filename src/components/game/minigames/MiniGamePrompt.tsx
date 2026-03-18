import { useState, useCallback, useMemo } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CatchTheYarn } from './CatchTheYarn';
import { CatNapTiming } from './CatNapTiming';
import { TreatToss } from './TreatToss';
import { WhackAMouse } from './WhackAMouse';
import { MemoryMatch } from './MemoryMatch';
import { MiniGameReward } from './MiniGameReward';

export type MiniGameType = 'yarn' | 'nap' | 'treats' | 'whack' | 'memory';

interface MiniGamePromptProps {
  gameType: MiniGameType;
  isOpen: boolean;
  onClose: () => void;
  onReward: (reward: { coins: number; treats: number; happiness: number }) => void;
}

const GAME_INFO: Record<MiniGameType, { name: string; emoji: string; desc: string }> = {
  yarn: { name: 'Catch the Yarn', emoji: '🧶', desc: 'Click the bouncing yarn ball!' },
  nap: { name: 'Cat Nap', emoji: '😴', desc: 'Time the perfect nap!' },
  treats: { name: 'Treat Toss', emoji: '🐟', desc: 'Catch falling treats!' },
  whack: { name: 'Whack-a-Mouse', emoji: '🐭', desc: 'Whack those sneaky mice!' },
  memory: { name: 'Memory Match', emoji: '🃏', desc: 'Find the matching cats!' },
};

function calculateReward(score: number): { coins: number; treats: number; happiness: number } {
  if (score >= 8) return { coins: 40 + Math.floor(Math.random() * 20), treats: 3, happiness: 15 };
  if (score >= 5) return { coins: 20 + Math.floor(Math.random() * 15), treats: 2, happiness: 10 };
  if (score >= 3) return { coins: 10 + Math.floor(Math.random() * 10), treats: 1, happiness: 5 };
  return { coins: 5, treats: 0, happiness: 3 };
}

export function MiniGamePrompt({ gameType, isOpen, onClose, onReward }: MiniGamePromptProps) {
  const [phase, setPhase] = useState<'prompt' | 'playing' | 'reward'>('prompt');
  const [score, setScore] = useState(0);
  const [reward, setReward] = useState({ coins: 0, treats: 0, happiness: 0 });

  const info = GAME_INFO[gameType];

  const handleComplete = useCallback((s: number) => {
    const r = calculateReward(s);
    setScore(s);
    setReward(r);
    setPhase('reward');
  }, []);

  const handleSkip = useCallback(() => {
    setPhase('prompt');
    onClose();
  }, [onClose]);

  const handleClaim = useCallback(() => {
    onReward(reward);
    setPhase('prompt');
    onClose();
  }, [reward, onReward, onClose]);

  const gameComponent = useMemo(() => {
    if (phase !== 'playing') return null;
    const props = { onComplete: handleComplete, onSkip: handleSkip };
    switch (gameType) {
      case 'yarn': return <CatchTheYarn {...props} />;
      case 'nap': return <CatNapTiming {...props} />;
      case 'treats': return <TreatToss {...props} />;
      case 'whack': return <WhackAMouse {...props} />;
      case 'memory': return <MemoryMatch {...props} />;
    }
  }, [phase, gameType, handleComplete, handleSkip]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleSkip(); }}>
      <DialogContent className="max-w-sm p-4 gap-0 overflow-hidden">
        {phase === 'prompt' && (
          <div className="flex flex-col items-center gap-4 py-4 animate-fade-in">
            <div className="relative">
              <span className="text-6xl animate-bounce" style={{ animationDuration: '1.5s' }}>
                {info.emoji}
              </span>
              <span className="absolute -top-1 -right-2 text-2xl animate-bounce" style={{ animationDelay: '0.3s' }}>
                🐱
              </span>
            </div>
            <div className="text-center">
              <h2 className="text-xl font-bold text-primary">{info.name}!</h2>
              <p className="text-sm text-muted-foreground mt-1">{info.desc}</p>
              <p className="text-xs text-muted-foreground mt-2 italic">Win coins, treats & happiness!</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setPhase('playing')} className="px-6 font-bold">
                🎮 Play!
              </Button>
              <Button variant="ghost" onClick={handleSkip}>
                Skip
              </Button>
            </div>
          </div>
        )}

        {phase === 'playing' && (
          <div className="py-2 animate-fade-in">{gameComponent}</div>
        )}

        {phase === 'reward' && (
          <div className="py-4">
            <MiniGameReward
              gameName={info.name}
              score={score}
              reward={reward}
              onClaim={handleClaim}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
