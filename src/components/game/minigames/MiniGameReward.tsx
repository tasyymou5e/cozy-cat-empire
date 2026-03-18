import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface MiniGameRewardProps {
  gameName: string;
  score: number;
  reward: { coins: number; treats: number; happiness: number };
  onClaim: () => void;
}

export function MiniGameReward({ gameName, score, reward, onClaim }: MiniGameRewardProps) {
  useEffect(() => {
    // Auto-dismiss after 5 seconds
    const t = setTimeout(onClaim, 5000);
    return () => clearTimeout(t);
  }, [onClaim]);

  const tier = score >= 8 ? 'legendary' : score >= 5 ? 'great' : 'good';

  return (
    <div className="flex flex-col items-center gap-3 animate-fade-in">
      <div className="relative">
        <span className="text-5xl">
          {tier === 'legendary' ? '🏆' : tier === 'great' ? '⭐' : '🎁'}
        </span>
        {tier === 'legendary' && (
          <>
            <span className="absolute -top-2 -left-3 text-lg animate-bounce">✨</span>
            <span className="absolute -top-2 -right-3 text-lg animate-bounce" style={{ animationDelay: '0.2s' }}>✨</span>
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-sm animate-ping">🌟</span>
          </>
        )}
      </div>

      <h3 className="font-bold text-primary text-lg">{gameName} Complete!</h3>

      <div className="flex gap-3 text-sm">
        {reward.coins > 0 && (
          <span className="bg-amber-100 dark:bg-amber-900/30 px-2 py-1 rounded-lg font-bold text-amber-700 dark:text-amber-300">
            +{reward.coins} 💰
          </span>
        )}
        {reward.treats > 0 && (
          <span className="bg-pink-100 dark:bg-pink-900/30 px-2 py-1 rounded-lg font-bold text-pink-700 dark:text-pink-300">
            +{reward.treats} 🍬
          </span>
        )}
        {reward.happiness > 0 && (
          <span className="bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-lg font-bold text-green-700 dark:text-green-300">
            +{reward.happiness} 😻
          </span>
        )}
      </div>

      <Button onClick={onClaim} size="sm" className="mt-1">
        Claim Rewards! 🎉
      </Button>
    </div>
  );
}
