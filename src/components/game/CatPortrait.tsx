import React, { useState } from 'react';
import { Cat } from '@/types/game';
import { CatAvatar } from './CatAvatar';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

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

  return (
    <div className="relative flex flex-col items-center gap-3">
      {/* Portrait Container */}
      <div className={cn(
        "relative w-48 h-48 rounded-2xl overflow-hidden",
        "bg-gradient-to-br from-muted/50 to-muted",
        "border-4 border-primary/20 shadow-lg",
        state === 'generating' && "animate-pulse"
      )}>
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

        {/* Grade Border Glow */}
        {cat.grade >= 15 && (
          <div className="absolute inset-0 pointer-events-none border-4 rounded-2xl border-yellow-400/50 animate-pulse" />
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
