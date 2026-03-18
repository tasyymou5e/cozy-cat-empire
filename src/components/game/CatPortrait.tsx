import React, { useState, useMemo } from 'react';
import { Cat } from '@/types/game';
import { CatVisual } from './CatVisual';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  Loader2,
  RefreshCw,
  AlertCircle,
  AlertTriangle,
  Star,
  Crown,
  Trophy,
  Coins,
  ShoppingCart,
  Camera,
  Palette,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { getGradeTier, getGradeStars } from '@/types/grading';
import { getCostumeById } from '@/types/costumes';
import {
  isPortraitOutdated,
  computeAppearanceHash,
  PORTRAIT_CREDIT_COST,
} from '@/lib/portraitUtils';
import { usePortraitCredits } from '@/hooks/usePortraitCredits';
import { PortraitPurchaseDialog } from './PortraitPurchaseDialog';
import { usePortraitStyle } from '@/hooks/usePortraitStyle';
import { PORTRAIT_STYLES, type PortraitStyle } from '@/config/portraitSettings';
import { useGraphicsSettings } from '@/hooks/useGraphicsSettings';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

function TierIcon({ tier, className }: { tier: string; className?: string }) {
  switch (tier) {
    case 'ultraRare':
      return <Crown className={cn(className, 'text-pink-400 animate-pulse')} />;
    case 'veryRare':
      return <Crown className={cn(className, 'text-yellow-400')} />;
    case 'rare':
      return <Trophy className={cn(className, 'text-purple-400')} />;
    case 'uncommon':
      return <Star className={cn(className, 'text-blue-400')} />;
    default:
      return <Star className={cn(className, 'text-muted-foreground')} />;
  }
}

interface CatPortraitProps {
  cat: Cat;
  equippedCostumeId?: string;
  onPortraitGenerated?: (catId: string, portraitUrl: string, hash: string) => void;
  currentMoney?: number;
  onMoneyChange?: (newMoney: number) => void;
  /** Callback when cat's portrait style changes */
  onStyleChange?: (catId: string, style: PortraitStyle) => void;
}

type PortraitState = 'idle' | 'generating' | 'complete' | 'error';

export function CatPortrait({
  cat,
  equippedCostumeId,
  onPortraitGenerated,
  currentMoney = 0,
  onMoneyChange,
}: CatPortraitProps) {
  const [state, setState] = useState<PortraitState>(cat.portraitUrl ? 'complete' : 'idle');
  const [error, setError] = useState<string | null>(null);
  const [localPortraitUrl, setLocalPortraitUrl] = useState<string | undefined>(cat.portraitUrl);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);

  const {
    credits,
    packageConfig,
    isLoading: creditsLoading,
    isPurchasing,
    purchaseCredits,
    refetch: refetchCredits,
  } = usePortraitCredits();

  // Check if portrait is outdated using appearance hash
  const isOutdated = useMemo(() => {
    return isPortraitOutdated(cat, equippedCostumeId);
  }, [cat, equippedCostumeId]);

  const hasCredits = (credits?.creditsRemaining || 0) >= PORTRAIT_CREDIT_COST;

  const generatePortrait = async () => {
    if (!hasCredits) {
      setShowPurchaseDialog(true);
      return;
    }

    setState('generating');
    setError(null);

    // Get costume details if equipped
    const costume = equippedCostumeId ? getCostumeById(equippedCostumeId) : undefined;

    try {
      const { data, error: fnError } = await supabase.functions.invoke('generate-cat-portrait', {
        body: {
          cat: {
            id: cat.id,
            name: cat.name,
            breed: cat.breed,
            personality: cat.personality,
            appearance: cat.appearance,
            costume: costume
              ? {
                  id: costume.id,
                  name: costume.name,
                  emoji: costume.emoji,
                  category: costume.category,
                }
              : undefined,
          },
        },
      });

      if (fnError) {
        throw new Error(fnError.message || 'Failed to generate portrait');
      }

      if (data?.error) {
        // Handle insufficient credits error
        if (data.error === 'insufficient_credits') {
          setShowPurchaseDialog(true);
          setState('idle');
          return;
        }
        throw new Error(data.error);
      }

      if (data?.portraitUrl) {
        setLocalPortraitUrl(data.portraitUrl);
        setState('complete');
        const hash = computeAppearanceHash(cat, equippedCostumeId);
        onPortraitGenerated?.(cat.id, data.portraitUrl, hash);
        // Refetch credits after successful generation
        refetchCredits();
      } else {
        throw new Error('No portrait URL received');
      }
    } catch (err) {
      console.error('Portrait generation error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate portrait';

      // Check for insufficient credits in error message
      if (
        errorMessage.includes('insufficient_credits') ||
        errorMessage.includes('portrait credits')
      ) {
        setShowPurchaseDialog(true);
        setState('idle');
        return;
      }

      setError(errorMessage);
      setState('error');
    }
  };

  const handlePurchaseConfirm = async () => {
    const result = await purchaseCredits();
    if (result.success) {
      setShowPurchaseDialog(false);
      // Update money in parent component if callback provided
      if (result.newMoneyBalance !== undefined && onMoneyChange) {
        onMoneyChange(result.newMoneyBalance);
      }
    }
  };

  const handleGenerateClick = () => {
    if (hasCredits) {
      setShowConfirmDialog(true);
    } else {
      setShowPurchaseDialog(true);
    }
  };

  const portraitUrl = localPortraitUrl || cat.portraitUrl;

  const tier = getGradeTier(cat.grade);
  const stars = getGradeStars(cat.grade);

  const tierStarColors = {
    ultraRare: 'fill-pink-400 text-pink-400',
    veryRare: 'fill-yellow-400 text-yellow-400',
    rare: 'fill-purple-400 text-purple-400',
    uncommon: 'fill-blue-400 text-blue-400',
    common: 'fill-muted-foreground text-muted-foreground',
  };

  const tierGradeColors = {
    ultraRare:
      'bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 bg-clip-text text-transparent',
    veryRare: 'text-yellow-300',
    rare: 'text-purple-300',
    uncommon: 'text-blue-300',
    common: 'text-white',
  };

  return (
    <div className="relative flex flex-col items-center gap-3">
      {/* Credits Badge */}
      {!creditsLoading && (
        <div className="absolute -top-2 -right-2 z-30">
          <Badge
            variant={hasCredits ? 'secondary' : 'outline'}
            className={cn(
              'text-xs gap-1 cursor-pointer transition-colors',
              hasCredits
                ? 'bg-primary/10 text-primary hover:bg-primary/20'
                : 'bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-300'
            )}
            onClick={() => setShowPurchaseDialog(true)}
          >
            <Sparkles className="h-3 w-3" />
            {credits?.creditsRemaining || 0}
          </Badge>
        </div>
      )}

      {/* Portrait Container */}
      <div
        className={cn(
          'relative w-48 h-48 rounded-2xl overflow-hidden',
          'bg-gradient-to-br from-muted/50 to-muted',
          'border-4 shadow-lg',
          tier === 'ultraRare' && 'border-pink-400 animate-rainbow',
          tier === 'veryRare' &&
            'border-yellow-400 animate-grade-glow [--grade-color:hsl(45,90%,50%)]',
          tier === 'rare' && 'border-purple-400',
          tier === 'uncommon' && 'border-blue-400',
          tier === 'common' && 'border-primary/20',
          state === 'generating' && 'animate-pulse',
          isOutdated && 'ring-2 ring-orange-400 ring-offset-2 ring-offset-background'
        )}
      >
        {/* Outdated Badge */}
        {isOutdated && state === 'complete' && (
          <div className="absolute top-2 left-2 z-20">
            <Badge className="bg-orange-500 text-white text-xs gap-1 shadow-lg">
              <AlertTriangle className="h-3 w-3" />
              Outdated
            </Badge>
          </div>
        )}
        {/* Ranking Overlay at Top */}
        {portraitUrl && state !== 'generating' && (
          <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/70 via-black/40 to-transparent px-3 py-2">
            <div className="flex items-center justify-between">
              {/* Grade Badge with Tier Icon */}
              <div className="flex items-center gap-1.5">
                <TierIcon tier={tier} className="h-5 w-5 drop-shadow-lg" />
                <span
                  className={cn('font-extrabold text-lg drop-shadow-lg', tierGradeColors[tier])}
                >
                  {cat.grade}
                </span>
              </div>

              {/* Stars Display */}
              {stars > 0 && (
                <div className="flex gap-0.5">
                  {Array.from({ length: stars }).map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        'h-4 w-4 drop-shadow-lg',
                        tierStarColors[tier],
                        tier === 'ultraRare' && 'animate-star-spin'
                      )}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Show AI Portrait if available */}
        {portraitUrl && state !== 'generating' ? (
          <img
            src={portraitUrl}
            alt={`Portrait of ${cat.name}`}
            className="w-full h-full object-cover animate-fade-in"
            onError={() => {
              setLocalPortraitUrl(undefined);
              setState('idle');
            }}
          />
        ) : (
          /* Show CatVisual as fallback */
          <CatVisual
            cat={cat}
            equippedCostumeId={equippedCostumeId}
            size="xl"
            animated
            className="w-full h-full"
          />
        )}

        {/* Generating Overlay */}
        {state === 'generating' && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground font-medium">Creating portrait...</p>
          </div>
        )}

        {/* Error Overlay */}
        {state === 'error' && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2 p-4">
            <AlertCircle className="w-6 h-6 text-destructive" />
            <p className="text-xs text-destructive text-center">{error}</p>
          </div>
        )}

        {/* Sparkle effect for ultra rare */}
        {tier === 'ultraRare' && portraitUrl && state === 'complete' && (
          <div className="absolute inset-0 pointer-events-none">
            <Sparkles className="absolute top-2 right-2 h-4 w-4 text-pink-300 animate-pulse" />
            <Sparkles className="absolute bottom-4 left-3 h-3 w-3 text-purple-300 animate-pulse delay-300" />
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {state === 'idle' && !portraitUrl && (
        <div className="flex flex-col items-center gap-1">
          {hasCredits ? (
            <Button
              onClick={handleGenerateClick}
              variant="outline"
              size="sm"
              className="gap-2 bg-gradient-to-r from-primary/10 to-secondary/10 hover:from-primary/20 hover:to-secondary/20"
            >
              <Sparkles className="w-4 h-4" />
              Generate Portrait
            </Button>
          ) : (
            <Button
              onClick={() => setShowPurchaseDialog(true)}
              variant="outline"
              size="sm"
              className="gap-2 bg-gradient-to-r from-amber-500/10 to-orange-500/10 hover:from-amber-500/20 hover:to-orange-500/20 text-amber-700 dark:text-amber-300"
            >
              <ShoppingCart className="w-4 h-4" />
              Buy {packageConfig.portraits} Portraits
              <Badge variant="secondary" className="ml-1 gap-1 text-xs">
                <Coins className="w-3 h-3" />${packageConfig.cost.toLocaleString()}
              </Badge>
            </Button>
          )}
        </div>
      )}

      {state === 'error' && (
        <Button onClick={handleGenerateClick} variant="outline" size="sm" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Try Again
        </Button>
      )}

      {state === 'complete' && portraitUrl && (
        <div className="flex flex-col items-center gap-1">
          {isOutdated ? (
            <>
              <Button
                onClick={handleGenerateClick}
                variant="secondary"
                size="sm"
                className="gap-2 bg-orange-100 hover:bg-orange-200 text-orange-700 dark:bg-orange-900/20 dark:hover:bg-orange-900/40 dark:text-orange-300"
              >
                <RefreshCw className="w-4 h-4" />
                Update Portrait
              </Button>
              <p className="text-xs text-muted-foreground text-center max-w-[180px]">
                Appearance changed since portrait was created
              </p>
            </>
          ) : (
            <Button
              onClick={handleGenerateClick}
              variant="ghost"
              size="sm"
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className="w-4 h-4" />
              Regenerate
            </Button>
          )}
        </div>
      )}

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Generate AI Portrait?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  Create a unique AI-generated portrait for <strong>{cat.name}</strong>.
                </p>
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    <span className="font-medium">Cost:</span>
                  </div>
                  <Badge variant="secondary">{PORTRAIT_CREDIT_COST} credit</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="text-muted-foreground">Your credits:</span>
                  <span className="font-bold text-primary">{credits?.creditsRemaining || 0}</span>
                </div>
                {isOutdated && (
                  <p className="text-sm text-orange-600 dark:text-orange-400">
                    The current portrait is outdated due to appearance changes.
                  </p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowConfirmDialog(false);
                generatePortrait();
              }}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Portrait
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Purchase Dialog */}
      <PortraitPurchaseDialog
        open={showPurchaseDialog}
        onOpenChange={setShowPurchaseDialog}
        packageCost={packageConfig.cost}
        packageSize={packageConfig.portraits}
        currentMoney={currentMoney}
        isPurchasing={isPurchasing}
        onConfirm={handlePurchaseConfirm}
      />
    </div>
  );
}
