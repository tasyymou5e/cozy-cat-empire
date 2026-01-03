import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Gift, Check, X, Sparkles } from 'lucide-react';
import { Cat, BREEDS } from '@/types/game';
import { CatAvatar } from './CatAvatar';

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
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-2 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center animate-bounce">
            <Gift className="w-8 h-8 text-primary" />
          </div>
          <DialogTitle className="text-xl flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-500" />
            You Received a Gift!
            <Sparkles className="w-5 h-5 text-yellow-500" />
          </DialogTitle>
          <DialogDescription>
            {gift.sender_name || 'Someone'} sent you a cat!
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-4">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center border-4 border-primary/30">
              <CatAvatar cat={gift.cat_data} size="lg" />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-1">
              <Badge variant="outline" className="text-xs">
                {breed?.name || gift.cat_data.breed}
              </Badge>
            </div>
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

        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onDecline(gift.id)}
          >
            <X className="w-4 h-4 mr-2" />
            Decline
          </Button>
          <Button
            className="flex-1"
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
