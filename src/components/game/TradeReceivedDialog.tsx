import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeftRight, Check, X, Sparkles, Coins, Package } from 'lucide-react';
import { Cat, Resources, BREEDS } from '@/types/game';
import { CatVisual } from './CatVisual';

interface TradeOffer {
  id: string;
  sender_id: string;
  recipient_id: string;
  offered_cats: Cat[];
  offered_money: number;
  offered_resources: Partial<Resources>;
  requested_cats: Cat[];
  requested_money: number;
  requested_resources: Partial<Resources>;
  message: string | null;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
  created_at: string;
  expires_at: string;
  sender_name?: string;
}

interface TradeReceivedDialogProps {
  trade: TradeOffer | null;
  onAccept: (tradeId: string) => Promise<void>;
  onDecline: (tradeId: string) => Promise<void>;
  onClose: () => void;
}

export function TradeReceivedDialog({ trade, onAccept, onDecline, onClose }: TradeReceivedDialogProps) {
  if (!trade) return null;

  const hasOfferedCats = trade.offered_cats && trade.offered_cats.length > 0;
  const hasOfferedMoney = trade.offered_money > 0;
  const hasOfferedResources = trade.offered_resources && Object.keys(trade.offered_resources).length > 0;
  const hasRequestedMoney = trade.requested_money > 0;
  const hasRequestedResources = trade.requested_resources && Object.keys(trade.requested_resources).length > 0;

  return (
    <Dialog open={!!trade} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-2 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center animate-trade-pulse">
            <ArrowLeftRight className="w-8 h-8 text-primary" />
          </div>
          <DialogTitle className="text-xl flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            Trade Offer Received!
            <Sparkles className="w-5 h-5 text-amber-500" />
          </DialogTitle>
          <DialogDescription>
            {trade.sender_name || 'Someone'} wants to trade with you!
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-4">
          {/* What You'll Receive */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-center text-green-600 dark:text-green-400 flex items-center justify-center gap-1">
              <Package className="w-4 h-4" />
              You'll Receive
            </h4>
            <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-3 min-h-[100px] space-y-2">
              {hasOfferedCats && (
                <div className="space-y-1">
                  {trade.offered_cats.map((cat, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      <CatVisual cat={cat} size="sm" preferPortrait={true} />
                      <span className="font-medium">{cat.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {BREEDS[cat.breed]?.name || cat.breed}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
              {hasOfferedMoney && (
                <div className="flex items-center gap-2 text-sm">
                  <Coins className="w-4 h-4 text-yellow-500" />
                  <span className="font-medium">${trade.offered_money}</span>
                </div>
              )}
              {hasOfferedResources && (
                <div className="text-xs text-muted-foreground">
                  {Object.entries(trade.offered_resources).map(([key, value]) => (
                    value ? <div key={key}>{key}: {value}</div> : null
                  ))}
                </div>
              )}
              {!hasOfferedCats && !hasOfferedMoney && !hasOfferedResources && (
                <p className="text-xs text-muted-foreground text-center">Nothing offered</p>
              )}
            </div>
          </div>

          {/* What They Want */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-center text-orange-600 dark:text-orange-400 flex items-center justify-center gap-1">
              <Package className="w-4 h-4" />
              They Want
            </h4>
            <div className="bg-orange-50 dark:bg-orange-950/30 rounded-lg p-3 min-h-[100px] space-y-2">
              {hasRequestedMoney && (
                <div className="flex items-center gap-2 text-sm">
                  <Coins className="w-4 h-4 text-yellow-500" />
                  <span className="font-medium">${trade.requested_money}</span>
                </div>
              )}
              {hasRequestedResources && (
                <div className="text-xs text-muted-foreground">
                  {Object.entries(trade.requested_resources).map(([key, value]) => (
                    value ? <div key={key}>{key}: {value}</div> : null
                  ))}
                </div>
              )}
              {!hasRequestedMoney && !hasRequestedResources && (
                <p className="text-xs text-muted-foreground text-center">Nothing requested</p>
              )}
            </div>
          </div>
        </div>

        {trade.message && (
          <div className="w-full p-3 bg-muted rounded-lg text-center">
            <p className="text-sm italic">"{trade.message}"</p>
            <p className="text-xs text-muted-foreground mt-1">— {trade.sender_name || 'Anonymous'}</p>
          </div>
        )}

        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onDecline(trade.id)}
          >
            <X className="w-4 h-4 mr-2" />
            Decline
          </Button>
          <Button
            className="flex-1"
            onClick={() => onAccept(trade.id)}
          >
            <Check className="w-4 h-4 mr-2" />
            Accept Trade
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
