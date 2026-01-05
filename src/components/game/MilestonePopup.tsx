import { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Milestone, CelebrationType } from '@/types/milestones';
import { Sparkles, Trophy, Crown, Coins } from 'lucide-react';
import confetti from 'canvas-confetti';

interface MilestonePopupProps {
  milestone: Milestone | null;
  onClaim: () => void;
  onDismiss: () => void;
}

function triggerCelebration(type: CelebrationType) {
  const defaults = {
    spread: 360,
    ticks: 100,
    gravity: 0.5,
    decay: 0.94,
    startVelocity: 30,
    origin: { x: 0.5, y: 0.5 },
  };

  switch (type) {
    case 'confetti':
      confetti({
        ...defaults,
        particleCount: 100,
        colors: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#6c5ce7'],
      });
      break;
    case 'fireworks':
      const duration = 2000;
      const end = Date.now() + duration;
      const interval = setInterval(() => {
        if (Date.now() > end) {
          clearInterval(interval);
          return;
        }
        confetti({
          particleCount: 50,
          angle: 60 + Math.random() * 60,
          spread: 55,
          origin: { x: Math.random(), y: Math.random() - 0.2 },
          colors: ['#ff0000', '#ff7700', '#ffff00', '#00ff00', '#0000ff', '#8b00ff'],
        });
      }, 250);
      break;
    case 'rainbow':
      const colors = ['#ff0000', '#ff7f00', '#ffff00', '#00ff00', '#0000ff', '#4b0082', '#9400d3'];
      colors.forEach((color, i) => {
        setTimeout(() => {
          confetti({
            particleCount: 30,
            angle: 90 + (i - 3) * 15,
            spread: 45,
            origin: { x: 0.5, y: 0.6 },
            colors: [color],
          });
        }, i * 100);
      });
      break;
    case 'goldRain':
      confetti({
        ...defaults,
        particleCount: 150,
        colors: ['#ffd700', '#ffec8b', '#daa520', '#b8860b'],
        shapes: ['circle'],
        gravity: 1.2,
      });
      break;
  }
}

export function MilestonePopup({ milestone, onClaim, onDismiss }: MilestonePopupProps) {
  useEffect(() => {
    if (milestone) {
      triggerCelebration(milestone.celebrationType);
    }
  }, [milestone]);

  if (!milestone) return null;

  return (
    <Dialog open={!!milestone} onOpenChange={(open) => !open && onDismiss()}>
      <DialogContent className="sm:max-w-md text-center">
        <DialogHeader>
          <DialogTitle className="text-center flex items-center justify-center gap-2">
            <Trophy className="h-6 w-6 text-yellow-500" />
            Milestone Achieved!
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-6 space-y-4">
          {/* Big emoji */}
          <div className="text-7xl animate-bounce">
            {milestone.emoji}
          </div>
          
          {/* Milestone name */}
          <h3 className="text-2xl font-bold text-primary">
            {milestone.name}
          </h3>
          
          {/* Description */}
          <p className="text-muted-foreground">
            {milestone.description}
          </p>
          
          {/* Rewards */}
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            {milestone.reward.coins && (
              <Badge variant="secondary" className="text-lg px-3 py-1">
                <Coins className="h-4 w-4 mr-1" />
                +{milestone.reward.coins} coins
              </Badge>
            )}
            {milestone.reward.title && (
              <Badge variant="outline" className="text-lg px-3 py-1 border-primary">
                <Crown className="h-4 w-4 mr-1 text-yellow-500" />
                "{milestone.reward.title}" title
              </Badge>
            )}
            {milestone.reward.costume && (
              <Badge className="text-lg px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500">
                <Sparkles className="h-4 w-4 mr-1" />
                {milestone.reward.costume} costume
              </Badge>
            )}
          </div>
        </div>
        
        <Button 
          onClick={onClaim} 
          className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
          size="lg"
        >
          <Sparkles className="h-5 w-5 mr-2" />
          Claim Reward!
        </Button>
      </DialogContent>
    </Dialog>
  );
}
