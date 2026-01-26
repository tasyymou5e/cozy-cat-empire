import { Cat } from '@/types/game';
import { EmpireInteraction } from '@/types/empire';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Heart, Utensils, Gamepad2, Camera, User } from 'lucide-react';

interface EmpireInteractionMenuProps {
  cat: Cat;
  onAction: (action: EmpireInteraction) => void;
  canFeed: boolean;
  canPlay: boolean;
}

/**
 * Interaction menu that appears when clicking a cat in the Empire view
 */
export function EmpireInteractionMenu({
  cat,
  onAction,
  canFeed,
  canPlay,
}: EmpireInteractionMenuProps) {
  return (
    <div className="w-48 p-2">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl">🐱</span>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{cat.name}</p>
          <p className="text-xs text-muted-foreground">Grade {cat.grade}</p>
        </div>
      </div>
      
      <Separator className="my-2" />
      
      <div className="space-y-1">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 h-9"
          onClick={() => onAction('pet')}
        >
          <Heart className="h-4 w-4 text-primary" />
          <span>Pet</span>
          <span className="ml-auto text-xs text-muted-foreground">+5 😊</span>
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 h-9"
          onClick={() => onAction('feed')}
          disabled={!canFeed}
        >
          <Utensils className="h-4 w-4 text-primary" />
          <span>Feed</span>
          <span className="ml-auto text-xs text-muted-foreground">-1 🥫</span>
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 h-9"
          onClick={() => onAction('play')}
          disabled={!canPlay}
        >
          <Gamepad2 className="h-4 w-4 text-primary" />
          <span>Play</span>
          <span className="ml-auto text-xs text-muted-foreground">-1 🧸</span>
        </Button>
        
        <Separator className="my-1" />
        
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 h-9"
          onClick={() => onAction('photobooth')}
        >
          <Camera className="h-4 w-4 text-primary" />
          <span>Photo Booth</span>
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 h-9"
          onClick={() => onAction('details')}
        >
          <User className="h-4 w-4 text-muted-foreground" />
          <span>View Details</span>
        </Button>
      </div>
    </div>
  );
}
