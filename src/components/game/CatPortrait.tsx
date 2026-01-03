import React, { useState } from 'react';
import { Cat } from '@/types/game';
import { CatAvatar } from './CatAvatar';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, RefreshCw, AlertCircle, Star, Crown, Trophy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { getGradeTier, getGradeStars } from '@/types/grading';

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
  onPortraitGenerated?: (catId: string, portraitUrl: string) => void;
}

type PortraitState = 'idle' | 'generating' | 'complete' | 'error';

export function CatPortrait({ cat, equippedCostumeId, onPortraitGenerated }: CatPortraitProps) {
  const [state, setState] = useState<PortraitState>(cat.portraitUrl ? 'complete' : 'idle');
  const [error, setError] = useState<string | null>(null);
  const [localPortraitUrl, setLocalPortraitUrl] = useState<string | undefined>(cat.portraitUrl);

  const generatePortrait = async () => {
    setState('generating');
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('generate-cat-portrait', {
        body: {
          cat: {
            id: cat.id,
            name: cat.name,
            breed: cat.breed,
            personality: cat.personality,
            appearance: cat.appearance,
          },
        },
      });

      if (fnError) {
        throw new Error(fnError.message || 'Failed to generate portrait');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (data?.portraitUrl) {
        setLocalPortraitUrl(data.portraitUrl);
        setState('complete');
        onPortraitGenerated?.(cat.id, data.portraitUrl);
      } else {
        throw new Error('No portrait URL received');
      }
    } catch (err) {
      console.error('Portrait generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate portrait');
      setState('error');
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
    ultraRare: 'bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 bg-clip-text text-transparent',
    veryRare: 'text-yellow-300',
    rare: 'text-purple-300',
    uncommon: 'text-blue-300',
    common: 'text-white',
  };

  return (
    <div className="relative flex flex-col items-center gap-3">
      {/* Portrait Container */}
      <div className={cn(
        "relative w-48 h-48 rounded-2xl overflow-hidden",
        "bg-gradient-to-br from-muted/50 to-muted",
        "border-4 shadow-lg",
        tier === 'ultraRare' && "border-pink-400 animate-rainbow",
        tier === 'veryRare' && "border-yellow-400 animate-grade-glow [--grade-color:hsl(45,90%,50%)]",
        tier === 'rare' && "border-purple-400",
        tier === 'uncommon' && "border-blue-400",
        tier === 'common' && "border-primary/20",
        state === 'generating' && "animate-pulse"
      )}>
        {/* Ranking Overlay at Top */}
        {portraitUrl && state !== 'generating' && (
          <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/70 via-black/40 to-transparent px-3 py-2">
            <div className="flex items-center justify-between">
              {/* Grade Badge with Tier Icon */}
              <div className="flex items-center gap-1.5">
                <TierIcon tier={tier} className="h-5 w-5 drop-shadow-lg" />
                <span className={cn(
                  "font-extrabold text-lg drop-shadow-lg",
                  tierGradeColors[tier]
                )}>
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
                        "h-4 w-4 drop-shadow-lg",
                        tierStarColors[tier],
                        tier === 'ultraRare' && "animate-star-spin"
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
          /* Show CatAvatar as fallback */
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-background to-muted">
            <CatAvatar
              cat={cat}
              equippedCostumeId={equippedCostumeId}
              size="xl"
              animated
              showCostume
            />
          </div>
        )}

        {/* Generating Overlay */}
        {state === 'generating' && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground font-medium">
              Creating portrait...
            </p>
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
        <Button
          onClick={generatePortrait}
          variant="outline"
          size="sm"
          className="gap-2 bg-gradient-to-r from-primary/10 to-secondary/10 hover:from-primary/20 hover:to-secondary/20"
        >
          <Sparkles className="w-4 h-4" />
          Generate Portrait
        </Button>
      )}

      {state === 'error' && (
        <Button
          onClick={generatePortrait}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </Button>
      )}

      {state === 'complete' && portraitUrl && (
        <Button
          onClick={generatePortrait}
          variant="ghost"
          size="sm"
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <RefreshCw className="w-4 h-4" />
          Regenerate
        </Button>
      )}
    </div>
  );
}
