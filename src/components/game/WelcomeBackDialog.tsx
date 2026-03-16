/**
 * @fileoverview Welcome Back dialog for returning/lapsed players
 *
 * Shows a special catch-up bonus when players return after 3+ days away.
 *
 * @module components/game/WelcomeBackDialog
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Gift, Sparkles, Coins, Dices } from 'lucide-react';

export interface WelcomeBackBonus {
  coins: number;
  freeSpins: number;
  daysAway: number;
}

interface WelcomeBackDialogProps {
  open: boolean;
  bonus: WelcomeBackBonus | null;
  onClaim: () => void;
  onDismiss: () => void;
}

export function WelcomeBackDialog({ open, bonus, onClaim, onDismiss }: WelcomeBackDialogProps) {
  if (!bonus) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onDismiss()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Gift className="h-6 w-6 text-primary" />
            Welcome Back! 🎉
          </DialogTitle>
          <DialogDescription>
            We missed you! You've been away for {bonus.daysAway} days.
            Here's a catch-up bonus to get you back on track!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Bonus items */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <Coins className="h-8 w-8 text-yellow-500" />
              <div>
                <div className="text-lg font-bold text-yellow-500">+{bonus.coins}</div>
                <div className="text-xs text-muted-foreground">Bonus Coins</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <Dices className="h-8 w-8 text-purple-500" />
              <div>
                <div className="text-lg font-bold text-purple-500">+{bonus.freeSpins}</div>
                <div className="text-xs text-muted-foreground">Free Spins</div>
              </div>
            </div>
          </div>

          {/* Scaling info */}
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              Bonus scales with time away (up to 7 days)
            </span>
          </div>

          <Badge variant="secondary" className="w-full justify-center py-1">
            Your cats are happy to see you! 😺
          </Badge>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onDismiss}>
            Maybe Later
          </Button>
          <Button className="flex-1" onClick={onClaim}>
            <Gift className="h-4 w-4 mr-2" />
            Claim Bonus!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
