import React from 'react';
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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Coins, AlertTriangle } from 'lucide-react';

interface PortraitPurchaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  packageCost: number;
  packageSize: number;
  currentMoney: number;
  isPurchasing: boolean;
  onConfirm: () => void;
}

export function PortraitPurchaseDialog({
  open,
  onOpenChange,
  packageCost,
  packageSize,
  currentMoney,
  isPurchasing,
  onConfirm,
}: PortraitPurchaseDialogProps) {
  const canAfford = currentMoney >= packageCost;
  const moneyAfterPurchase = currentMoney - packageCost;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Purchase Portrait Credits
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Generate unique AI portraits for your cats! Each portrait uses 1 credit.
              </p>

              {/* Package Details */}
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Portrait Package</span>
                  <Badge variant="secondary" className="text-base">
                    {packageSize} Portraits
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-lg font-bold">
                  <span className="flex items-center gap-2">
                    <Coins className="h-5 w-5 text-yellow-500" />
                    Cost
                  </span>
                  <span className="text-primary">${packageCost.toLocaleString()}</span>
                </div>
              </div>

              {/* Money Status */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Your Balance:</span>
                  <span className={canAfford ? 'text-green-500 font-medium' : 'text-red-500 font-medium'}>
                    ${currentMoney.toLocaleString()}
                  </span>
                </div>
                {canAfford && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">After Purchase:</span>
                    <span className="font-medium">${moneyAfterPurchase.toLocaleString()}</span>
                  </div>
                )}
              </div>

              {/* Insufficient Funds Warning */}
              {!canAfford && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span className="text-sm">
                    You need ${(packageCost - currentMoney).toLocaleString()} more coins.
                    Earn money through chores, cat shows, and selling cats!
                  </span>
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPurchasing}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={!canAfford || isPurchasing}
            className="gap-2"
          >
            {isPurchasing ? (
              <>
                <span className="animate-spin">⏳</span>
                Processing...
              </>
            ) : (
              <>
                <Coins className="h-4 w-4" />
                Buy {packageSize} Credits
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
