import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, Loader2, AlertCircle, Check, Crown } from 'lucide-react';
import { Cat, HouseSize } from '@/types/game';
import { TimeOfDay } from '@/types/empire';
import { RealSeason } from '@/lib/seasonUtils';
import { EMPIRE_RENDER_COST } from '@/hooks/useEmpireRender';
import { cn } from '@/lib/utils';

interface EmpireRenderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cats: Cat[];
  houseSize: HouseSize;
  timeOfDay: TimeOfDay;
  season: RealSeason;
  catCostumes: Record<string, string>;
  cost: number;
  canAfford: boolean;
  isRendering: boolean;
  onConfirm: () => void;
}

const TIER_NAMES: Record<HouseSize, string> = {
  apartment: 'Cozy Apartment',
  house: 'Suburban House',
  mansion: 'Luxury Mansion',
  farm: 'Cat Empire Farm',
};

const TIME_DISPLAY: Record<TimeOfDay, { emoji: string; label: string }> = {
  morning: { emoji: '🌅', label: 'Morning' },
  afternoon: { emoji: '☀️', label: 'Afternoon' },
  evening: { emoji: '🌆', label: 'Evening' },
  night: { emoji: '🌙', label: 'Night' },
};

const SEASON_DISPLAY: Record<RealSeason, { emoji: string; label: string }> = {
  spring: { emoji: '🌸', label: 'Spring' },
  summer: { emoji: '☀️', label: 'Summer' },
  autumn: { emoji: '🍂', label: 'Autumn' },
  winter: { emoji: '❄️', label: 'Winter' },
};

/**
 * Confirmation dialog for Empire AI rendering
 * Shows preview of what will be rendered and cost
 */
export function EmpireRenderDialog({
  open,
  onOpenChange,
  cats,
  houseSize,
  timeOfDay,
  season,
  catCostumes,
  cost,
  canAfford,
  isRendering,
  onConfirm,
}: EmpireRenderDialogProps) {
  const catsWithPortraits = useMemo(() => 
    cats.filter(c => c.portraitUrl),
    [cats]
  );
  const catsWithCostumes = useMemo(() => 
    cats.filter(c => catCostumes[c.id]),
    [cats, catCostumes]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Render Your Empire
          </DialogTitle>
          <DialogDescription>
            Generate a beautiful AI-rendered scene of your cat empire.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Scene preview */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <h4 className="font-medium text-sm">Scene Settings</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Location:</span>
                <Badge variant="outline">{TIER_NAMES[houseSize]}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Time:</span>
                <Badge variant="outline">
                  {TIME_DISPLAY[timeOfDay].emoji} {TIME_DISPLAY[timeOfDay].label}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Season:</span>
                <Badge variant="outline">
                  {SEASON_DISPLAY[season].emoji} {SEASON_DISPLAY[season].label}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Cats:</span>
                <Badge variant="outline">🐱 {cats.length}</Badge>
              </div>
            </div>
          </div>

          {/* Cats preview */}
          {cats.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Cats in Scene</h4>
              <ScrollArea className="h-[120px]">
                <div className="space-y-1.5">
                  {cats.slice(0, 8).map(cat => (
                    <div
                      key={cat.id}
                      className="flex items-center gap-2 text-sm bg-muted/30 rounded px-2 py-1"
                    >
                      <span>{cat.portraitUrl ? '🖼️' : '🐱'}</span>
                      <span className="font-medium truncate flex-1">{cat.name}</span>
                      <span className="text-muted-foreground text-xs capitalize">{cat.breed}</span>
                      {catCostumes[cat.id] && (
                        <Crown className="h-3 w-3 text-amber-500" />
                      )}
                    </div>
                  ))}
                  {cats.length > 8 && (
                    <p className="text-xs text-muted-foreground text-center py-1">
                      +{cats.length - 8} more cats
                    </p>
                  )}
                </div>
              </ScrollArea>
              
              <div className="flex gap-4 text-xs text-muted-foreground">
                <span>🖼️ {catsWithPortraits.length} with portraits</span>
                <span>👑 {catsWithCostumes.length} with costumes</span>
              </div>
            </div>
          )}

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Render Cost</p>
              <p className="text-sm text-muted-foreground">
                One-time payment for AI generation
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold">
                💰 {cost.toLocaleString()}
              </p>
            </div>
          </div>

          {!canAfford && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg p-3">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <p>
                You need more coins to render your empire.
              </p>
            </div>
          )}

          {/* Benefits info */}
          <div className="bg-primary/5 rounded-lg p-3 space-y-1.5">
            <p className="text-xs font-medium">What you get:</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li className="flex items-center gap-1.5">
                <Check className="h-3 w-3 text-primary" />
                Beautiful AI-rendered scene saved permanently
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="h-3 w-3 text-primary" />
                All your cats included with their costumes
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="h-3 w-3 text-primary" />
                High quality 4K resolution artwork
              </li>
            </ul>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isRendering}
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={!canAfford || isRendering}
            className="gap-2"
          >
            {isRendering ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Rendering...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Render for {cost.toLocaleString()}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
