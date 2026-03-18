import React, { useState, useCallback, useRef } from 'react';
import { Cat } from '@/types/game';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sparkles,
  Loader2,
  CheckCircle2,
  XCircle,
  Coins,
  AlertTriangle,
  ShoppingCart,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { getCostumeById } from '@/lib/costumeRegistry';
import {
  isPortraitOutdated,
  computeAppearanceHash,
  PORTRAIT_CREDIT_COST,
} from '@/lib/portraitUtils';
import { usePortraitCredits } from '@/hooks/usePortraitCredits';
import { PortraitPurchaseDialog } from './PortraitPurchaseDialog';
import { PORTRAIT_STYLES, type PortraitStyle } from '@/config/portraitSettings';
import { getGlobalPortraitStyle } from '@/config/portraitSettings';
import { cn } from '@/lib/utils';

interface BatchPortraitGeneratorProps {
  cats: Cat[];
  catCostumes: Record<string, string>;
  onPortraitGenerated: (catId: string, portraitUrl: string, hash: string) => void;
  currentMoney?: number;
  onMoneyChange?: (newMoney: number) => void;
}

interface GenerationResult {
  catId: string;
  catName: string;
  success: boolean;
  error?: string;
}

export function BatchPortraitGenerator({
  cats,
  catCostumes,
  onPortraitGenerated,
  currentMoney = 0,
  onMoneyChange,
}: BatchPortraitGeneratorProps) {
  const [batchStyle, setBatchStyle] = useState<PortraitStyle>(getGlobalPortraitStyle());
  const [showConfirm, setShowConfirm] = useState(false);
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, catName: '' });
  const [results, setResults] = useState<GenerationResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const abortRef = useRef(false);

  const {
    credits,
    packageConfig,
    isPurchasing,
    purchaseCredits,
    refetch: refetchCredits,
  } = usePortraitCredits();

  // Find cats that need portraits (no portrait OR outdated)
  const catsNeedingPortrait = cats.filter((cat) => {
    const costumeId = catCostumes[cat.id];
    if (!cat.portraitUrl) return true;
    return isPortraitOutdated(cat, costumeId);
  });

  const creditsRemaining = credits?.creditsRemaining || 0;
  const hasEnoughCredits = creditsRemaining >= catsNeedingPortrait.length;
  const catsCanGenerate = Math.min(catsNeedingPortrait.length, creditsRemaining);

  const generateBatch = useCallback(async () => {
    setShowConfirm(false);
    setIsGenerating(true);
    setResults([]);
    abortRef.current = false;

    // Only generate for cats we have credits for
    const catsToGenerate = catsNeedingPortrait.slice(0, creditsRemaining);
    const total = catsToGenerate.length;
    setProgress({ current: 0, total, catName: '' });

    for (let i = 0; i < catsToGenerate.length; i++) {
      if (abortRef.current) break;

      const cat = catsToGenerate[i];
      const costumeId = catCostumes[cat.id];
      const costume = costumeId ? getCostumeById(costumeId) : undefined;

      setProgress({ current: i, total, catName: cat.name });

      try {
        const { data, error } = await supabase.functions.invoke('generate-cat-portrait', {
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

        if (error) throw new Error(error.message);
        if (data?.error) {
          // Handle insufficient credits
          if (data.error === 'insufficient_credits') {
            setResults((prev) => [
              ...prev,
              {
                catId: cat.id,
                catName: cat.name,
                success: false,
                error: 'No credits remaining',
              },
            ]);
            break;
          }
          throw new Error(data.error);
        }

        if (data?.portraitUrl) {
          const hash = computeAppearanceHash(cat, costumeId);
          onPortraitGenerated(cat.id, data.portraitUrl, hash);
          setResults((prev) => [...prev, { catId: cat.id, catName: cat.name, success: true }]);
        }
      } catch (err) {
        console.error(`Failed to generate portrait for ${cat.name}:`, err);
        setResults((prev) => [
          ...prev,
          {
            catId: cat.id,
            catName: cat.name,
            success: false,
            error: err instanceof Error ? err.message : 'Unknown error',
          },
        ]);

        // Stop on rate limit or credit errors
        if (
          err instanceof Error &&
          (err.message.includes('429') ||
            err.message.includes('402') ||
            err.message.includes('Rate limit') ||
            err.message.includes('credit'))
        ) {
          break;
        }
      }

      // Add delay between requests to avoid rate limits
      if (i < catsToGenerate.length - 1 && !abortRef.current) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    setProgress({ current: total, total, catName: '' });
    setIsGenerating(false);
    setShowResults(true);
    refetchCredits();
  }, [catsNeedingPortrait, creditsRemaining, catCostumes, onPortraitGenerated, refetchCredits]);

  const handleCancel = () => {
    abortRef.current = true;
  };

  const handlePurchaseConfirm = async () => {
    const result = await purchaseCredits();
    if (result.success) {
      setShowPurchaseDialog(false);
      if (result.newMoneyBalance !== undefined && onMoneyChange) {
        onMoneyChange(result.newMoneyBalance);
      }
    }
  };

  if (catsNeedingPortrait.length === 0) return null;

  const successCount = results.filter((r) => r.success).length;
  const failCount = results.filter((r) => !r.success).length;

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            creditsRemaining > 0 ? setShowConfirm(true) : setShowPurchaseDialog(true)
          }
          className="gap-2"
        >
          <Sparkles className="h-4 w-4" />
          Generate Portraits
          <Badge variant="secondary" className="ml-1">
            {catsNeedingPortrait.length}
          </Badge>
        </Button>

        {/* Credits indicator */}
        <Badge
          variant={creditsRemaining > 0 ? 'secondary' : 'outline'}
          className={cn(
            'gap-1 cursor-pointer',
            creditsRemaining > 0
              ? 'bg-primary/10 text-primary'
              : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
          )}
          onClick={() => setShowPurchaseDialog(true)}
        >
          <Sparkles className="h-3 w-3" />
          {creditsRemaining} credits
        </Badge>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Generate AI Portraits?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                {!hasEnoughCredits && (
                  <div className="flex items-center gap-2 p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg text-orange-700 dark:text-orange-300">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span className="text-sm">
                      You only have {creditsRemaining} credits.{' '}
                      {catsNeedingPortrait.length - creditsRemaining} cats will be skipped.
                    </span>
                  </div>
                )}
                <p>
                  This will generate AI portraits for <strong>{catsCanGenerate}</strong> cat
                  {catsCanGenerate !== 1 ? 's' : ''}.
                </p>
                <div className="space-y-2 text-sm bg-muted/50 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      Credits needed:
                    </span>
                    <strong>{catsCanGenerate}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Your credits:</span>
                    <strong className="text-primary">{creditsRemaining}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>After generation:</span>
                    <strong>{creditsRemaining - catsCanGenerate}</strong>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Portraits are generated one at a time to ensure quality. This may take a few
                  minutes.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            {!hasEnoughCredits && (
              <Button
                variant="outline"
                onClick={() => {
                  setShowConfirm(false);
                  setShowPurchaseDialog(true);
                }}
                className="gap-2"
              >
                <ShoppingCart className="h-4 w-4" />
                Buy Credits
              </Button>
            )}
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={generateBatch} disabled={creditsRemaining < 1}>
              Generate {catsCanGenerate}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Progress Dialog */}
      <Dialog open={isGenerating} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              Generating Portraits...
            </DialogTitle>
            <DialogDescription>
              {progress.catName ? `Creating portrait for ${progress.catName}...` : 'Preparing...'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Progress value={(progress.current / progress.total) * 100} />
            <p className="text-sm text-center text-muted-foreground">
              {progress.current} of {progress.total} complete
            </p>
            {results.length > 0 && (
              <div className="flex items-center justify-center gap-4 text-sm">
                <span className="flex items-center gap-1 text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  {results.filter((r) => r.success).length} success
                </span>
                {results.some((r) => !r.success) && (
                  <span className="flex items-center gap-1 text-destructive">
                    <XCircle className="h-4 w-4" />
                    {results.filter((r) => !r.success).length} failed
                  </span>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Results Dialog */}
      <Dialog open={showResults} onOpenChange={setShowResults}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {failCount === 0 ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : successCount === 0 ? (
                <XCircle className="h-5 w-5 text-destructive" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
              )}
              Generation Complete
            </DialogTitle>
            <DialogDescription>
              {successCount} portrait{successCount !== 1 ? 's' : ''} generated successfully
              {failCount > 0 && `, ${failCount} failed`}
            </DialogDescription>
          </DialogHeader>
          {failCount > 0 && (
            <div className="max-h-40 overflow-y-auto space-y-2">
              {results
                .filter((r) => !r.success)
                .map((r) => (
                  <div
                    key={r.catId}
                    className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded px-3 py-2"
                  >
                    <XCircle className="h-4 w-4 shrink-0" />
                    <span>
                      {r.catName}: {r.error}
                    </span>
                  </div>
                ))}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowResults(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
    </>
  );
}
