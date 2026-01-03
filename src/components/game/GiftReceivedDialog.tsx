import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Gift, Check, X, Sparkles, Heart } from 'lucide-react';
import { Cat, BREEDS } from '@/types/game';
import { CatVisual } from './CatVisual';

interface CatGift {
  id: string;
  sender_id: string;
  recipient_id: string;
  cat_data: Cat;
  message: string | null;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  sender_name?: string;
}

interface GiftReceivedDialogProps {
  gift: CatGift | null;
  onAccept: (giftId: string) => Promise<void>;
  onDecline: (giftId: string) => Promise<void>;
  onClose: () => void;
}

export function GiftReceivedDialog({ gift, onAccept, onDecline, onClose }: GiftReceivedDialogProps) {
  if (!gift) return null;

  const breed = BREEDS[gift.cat_data.breed];

  return (
    <Dialog open={!!gift} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md overflow-hidden">
        {/* Floating sparkles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <Sparkles 
              key={i} 
              className="absolute text-yellow-400 animate-gift-sparkle"
              style={{
                left: `${15 + (i * 15)}%`,
                top: `${10 + (i % 3) * 25}%`,
                animationDelay: `${i * 0.3}s`,
                opacity: 0.7
              }}
              size={16}
            />
          ))}
        </div>

        <DialogHeader className="text-center relative z-10">
          <div className="mx-auto mb-2 w-16 h-16 rounded-full bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center animate-gift-unwrap">
            <Gift className="w-8 h-8 text-primary animate-bounce" />
          </div>
          <DialogTitle className="text-xl flex items-center justify-center gap-2">
            <Heart className="w-5 h-5 text-pink-500 animate-pulse" />
            You Received a Gift!
            <Heart className="w-5 h-5 text-pink-500 animate-pulse" />
          </DialogTitle>
          <DialogDescription>
            {gift.sender_name || 'Someone'} sent you a cat!
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-4 relative z-10">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center border-4 border-primary/30 animate-pulse-glow">
              <CatVisual cat={gift.cat_data} size="lg" preferPortrait={true} />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-1">
              <Badge variant="outline" className="text-xs">
                {breed?.name || gift.cat_data.breed}
              </Badge>
            </div>
            {/* Floating hearts */}
            {[...Array(3)].map((_, i) => (
              <Heart 
                key={i}
                className="absolute text-pink-400 animate-float-heart"
                style={{
                  right: `${-10 + i * 20}%`,
                  bottom: '60%',
                  animationDelay: `${i * 0.5}s`
                }}
                size={12}
              />
            ))}
          </div>

          <div className="text-center">
            <h3 className="text-lg font-bold">{gift.cat_data.name}</h3>
            <p className="text-sm text-muted-foreground">
              Age {gift.cat_data.age} • Grade {gift.cat_data.grade}
            </p>
          </div>

          {gift.message && (
            <div className="w-full p-3 bg-muted rounded-lg text-center">
              <p className="text-sm italic">"{gift.message}"</p>
              <p className="text-xs text-muted-foreground mt-1">— {gift.sender_name || 'Anonymous'}</p>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2 sm:gap-2 relative z-10">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onDecline(gift.id)}
          >
            <X className="w-4 h-4 mr-2" />
            Decline
          </Button>
          <Button
            className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
            onClick={() => onAccept(gift.id)}
          >
            <Check className="w-4 h-4 mr-2" />
            Accept
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
