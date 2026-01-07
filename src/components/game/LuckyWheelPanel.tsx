import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { WheelPrize, WHEEL_PRIZES, RARITY_COLORS, RARITY_GLOW } from '@/types/luckyWheel';
import { Dices, Sparkles, Gift, Clock, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';

interface LuckyWheelPanelProps {
  canSpin: boolean;
  spinsRemaining: number;
  isSpinning: boolean;
  lastPrize: WheelPrize | null;
  totalSpins: number;
  isVIP: boolean;
  onSpin: () => void;
  onClaimPrize: (prize: WheelPrize) => void;
  onClearPrize: () => void;
}

const WHEEL_SEGMENTS = 8;
const SEGMENT_ANGLE = 360 / WHEEL_SEGMENTS;

// Display prizes for wheel visual (subset of all prizes)
const DISPLAY_PRIZES = WHEEL_PRIZES.slice(0, WHEEL_SEGMENTS);

export function LuckyWheelPanel({
  canSpin,
  spinsRemaining,
  isSpinning,
  lastPrize,
  totalSpins,
  isVIP,
  onSpin,
  onClaimPrize,
  onClearPrize,
}: LuckyWheelPanelProps) {
  const [rotation, setRotation] = useState(0);
  const [showPrizeDialog, setShowPrizeDialog] = useState(false);
  const wheelRef = useRef<HTMLDivElement>(null);

  // Handle spin animation
  useEffect(() => {
    if (isSpinning) {
      // Random extra rotations (3-5 full spins) plus landing position
      const extraSpins = 3 + Math.random() * 2;
      const prizeIndex = lastPrize
        ? DISPLAY_PRIZES.findIndex((p) => p.id === lastPrize.id)
        : Math.floor(Math.random() * WHEEL_SEGMENTS);
      const targetAngle = extraSpins * 360 + prizeIndex * SEGMENT_ANGLE + SEGMENT_ANGLE / 2;
      setRotation((prev) => prev + targetAngle);
    }
  }, [isSpinning, lastPrize]);

  // Show prize dialog when spin completes
  useEffect(() => {
    if (lastPrize && !isSpinning) {
      setShowPrizeDialog(true);

      // Fire confetti for rare+ prizes
      if (['rare', 'ultra_rare', 'legendary'].includes(lastPrize.rarity)) {
        confetti({
          particleCount: lastPrize.rarity === 'legendary' ? 150 : 75,
          spread: 70,
          origin: { y: 0.6 },
          colors:
            lastPrize.rarity === 'legendary'
              ? ['#ffd700', '#ffec8b', '#daa520']
              : ['#4ecdc4', '#45b7d1', '#6c5ce7'],
        });
      }
    }
  }, [lastPrize, isSpinning]);

  const handleClaim = () => {
    if (lastPrize) {
      onClaimPrize(lastPrize);
      setShowPrizeDialog(false);
      onClearPrize();
    }
  };

  // Calculate time until reset
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  const hoursUntilReset = Math.floor((tomorrow.getTime() - now.getTime()) / (1000 * 60 * 60));
  const minutesUntilReset = Math.floor(
    ((tomorrow.getTime() - now.getTime()) % (1000 * 60 * 60)) / (1000 * 60)
  );

  return (
    <>
      <Card className="border-accent/30">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Dices className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Lucky Wheel</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {isVIP && (
                <Badge className="bg-amber-500/20 text-amber-700">
                  <Crown className="h-3 w-3 mr-1" /> VIP +1 Spin
                </Badge>
              )}
              <Badge variant="outline">
                <Gift className="h-3 w-3 mr-1" />
                {spinsRemaining} left
              </Badge>
            </div>
          </div>
          <CardDescription>Spin daily for free rewards!</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Wheel */}
          <div className="relative w-64 h-64 mx-auto mb-4">
            {/* Pointer */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10">
              <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-t-[20px] border-l-transparent border-r-transparent border-t-primary drop-shadow-lg" />
            </div>

            {/* Wheel container */}
            <div
              ref={wheelRef}
              className="w-full h-full rounded-full border-4 border-primary shadow-lg overflow-hidden"
              style={{
                transform: `rotate(${rotation}deg)`,
                transition: isSpinning
                  ? 'transform 3s cubic-bezier(0.17, 0.67, 0.12, 0.99)'
                  : 'none',
              }}
            >
              {DISPLAY_PRIZES.map((prize, index) => {
                const angle = index * SEGMENT_ANGLE;
                const bgColors = [
                  'bg-red-400',
                  'bg-orange-400',
                  'bg-yellow-400',
                  'bg-green-400',
                  'bg-teal-400',
                  'bg-blue-400',
                  'bg-indigo-400',
                  'bg-purple-400',
                ];

                return (
                  <div
                    key={prize.id}
                    className={cn('absolute w-1/2 h-1/2 origin-bottom-right', bgColors[index])}
                    style={{
                      transform: `rotate(${angle}deg) skewY(${90 - SEGMENT_ANGLE}deg)`,
                      transformOrigin: 'bottom right',
                      left: '50%',
                      top: 0,
                    }}
                  >
                    <span
                      className="absolute text-xl"
                      style={{
                        transform: `skewY(${-(90 - SEGMENT_ANGLE)}deg) rotate(${SEGMENT_ANGLE / 2}deg)`,
                        top: '30%',
                        left: '10%',
                      }}
                    >
                      {prize.emoji}
                    </span>
                  </div>
                );
              })}

              {/* Center circle */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-background border-2 border-primary flex items-center justify-center shadow-lg">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
            </div>
          </div>

          {/* Spin button */}
          <Button
            onClick={onSpin}
            disabled={!canSpin}
            className="w-full bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90"
            size="lg"
          >
            {isSpinning ? (
              <>
                <Sparkles className="h-5 w-5 mr-2 animate-spin" />
                Spinning...
              </>
            ) : canSpin ? (
              <>
                <Dices className="h-5 w-5 mr-2" />
                Spin the Wheel!
              </>
            ) : (
              <>
                <Clock className="h-5 w-5 mr-2" />
                Come back in {hoursUntilReset}h {minutesUntilReset}m
              </>
            )}
          </Button>

          {/* Stats */}
          <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
            <span>Total spins: {totalSpins}</span>
            <span>Resets at midnight</span>
          </div>

          {/* Prize odds info */}
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <p className="text-xs font-medium mb-2">Prize Odds:</p>
            <div className="flex flex-wrap gap-1">
              <Badge variant="outline" className="text-xs bg-gray-100">
                Common 60%
              </Badge>
              <Badge variant="outline" className="text-xs bg-green-100">
                Uncommon 25%
              </Badge>
              <Badge variant="outline" className="text-xs bg-blue-100">
                Rare 10%
              </Badge>
              <Badge variant="outline" className="text-xs bg-purple-100">
                Ultra Rare 4%
              </Badge>
              <Badge variant="outline" className="text-xs bg-amber-100">
                Legendary 1%
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Prize Won Dialog */}
      <Dialog open={showPrizeDialog} onOpenChange={setShowPrizeDialog}>
        <DialogContent className="sm:max-w-md text-center">
          <DialogHeader>
            <DialogTitle className="text-center">🎉 You Won!</DialogTitle>
          </DialogHeader>

          {lastPrize && (
            <div className="py-6 space-y-4">
              <div
                className={cn(
                  'text-7xl mx-auto w-24 h-24 rounded-full flex items-center justify-center',
                  RARITY_COLORS[lastPrize.rarity],
                  RARITY_GLOW[lastPrize.rarity]
                )}
              >
                {lastPrize.emoji}
              </div>

              <div>
                <h3 className="text-2xl font-bold">{lastPrize.name}</h3>
                <Badge className={cn('mt-1', RARITY_COLORS[lastPrize.rarity])}>
                  {lastPrize.rarity.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>

              {/* Prize details */}
              <div className="flex flex-wrap justify-center gap-2">
                {lastPrize.reward.coins && (
                  <Badge variant="secondary" className="text-lg px-3 py-1">
                    💰 +{lastPrize.reward.coins} coins
                  </Badge>
                )}
                {lastPrize.reward.food && (
                  <Badge variant="secondary" className="text-lg px-3 py-1">
                    🍖 +{lastPrize.reward.food} food
                  </Badge>
                )}
                {lastPrize.reward.treats && (
                  <Badge variant="secondary" className="text-lg px-3 py-1">
                    🍬 +{lastPrize.reward.treats} treats
                  </Badge>
                )}
                {lastPrize.reward.toys && (
                  <Badge variant="secondary" className="text-lg px-3 py-1">
                    🎾 +{lastPrize.reward.toys} toys
                  </Badge>
                )}
                {lastPrize.reward.medicine && (
                  <Badge variant="secondary" className="text-lg px-3 py-1">
                    💊 +{lastPrize.reward.medicine} medicine
                  </Badge>
                )}
              </div>
            </div>
          )}

          <Button onClick={handleClaim} className="w-full" size="lg">
            <Gift className="h-5 w-5 mr-2" />
            Claim Prize!
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
