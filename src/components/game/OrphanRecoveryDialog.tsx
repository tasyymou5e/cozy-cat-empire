/**
 * @fileoverview OrphanRecoveryDialog - UI for recovering lost cats
 *
 * Dialog that appears when orphaned cats are detected (cats with gallery
 * photos but missing from the current game save). Allows users to selectively
 * recover their lost cats.
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, Cat, ImageIcon, Loader2 } from 'lucide-react';
import type { OrphanedCat } from '@/hooks/useOrphanDetection';

interface OrphanRecoveryDialogProps {
  orphanedCats: OrphanedCat[];
  open: boolean;
  onClose: () => void;
  onRecover: (cats: OrphanedCat[]) => Promise<void>;
}

export function OrphanRecoveryDialog({
  orphanedCats,
  open,
  onClose,
  onRecover,
}: OrphanRecoveryDialogProps) {
  const [selectedCatIds, setSelectedCatIds] = useState<Set<string>>(
    new Set(orphanedCats.map((c) => c.catId))
  );
  const [isRecovering, setIsRecovering] = useState(false);

  const toggleCat = (catId: string) => {
    const newSelected = new Set(selectedCatIds);
    if (newSelected.has(catId)) {
      newSelected.delete(catId);
    } else {
      newSelected.add(catId);
    }
    setSelectedCatIds(newSelected);
  };

  const handleRecover = async () => {
    const catsToRecover = orphanedCats.filter((c) => selectedCatIds.has(c.catId));
    if (catsToRecover.length === 0) return;

    setIsRecovering(true);
    try {
      await onRecover(catsToRecover);
      onClose();
    } catch (err) {
      console.error('Failed to recover cats:', err);
    } finally {
      setIsRecovering(false);
    }
  };

  const selectAll = () => {
    setSelectedCatIds(new Set(orphanedCats.map((c) => c.catId)));
  };

  const selectNone = () => {
    setSelectedCatIds(new Set());
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Lost Cats Detected
          </DialogTitle>
          <DialogDescription>
            We found {orphanedCats.length} cat{orphanedCats.length !== 1 ? 's' : ''} with photos in
            your gallery that are missing from your current save. Would you like to recover them?
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-end gap-2 mb-2">
          <Button variant="ghost" size="sm" onClick={selectAll}>
            Select All
          </Button>
          <Button variant="ghost" size="sm" onClick={selectNone}>
            Select None
          </Button>
        </div>

        <ScrollArea className="max-h-[300px] pr-4">
          <div className="space-y-3">
            {orphanedCats.map((cat) => (
              <div
                key={cat.catId}
                className="flex items-center gap-3 p-3 rounded-lg border bg-muted/50 hover:bg-muted transition-colors"
              >
                <Checkbox
                  checked={selectedCatIds.has(cat.catId)}
                  onCheckedChange={() => toggleCat(cat.catId)}
                />

                {cat.portraitUrl ? (
                  <img
                    src={cat.portraitUrl}
                    alt={cat.catName}
                    className="w-12 h-12 rounded-full object-cover border-2 border-primary/20"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                    <Cat className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{cat.catName}</div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline" className="text-xs">
                      {cat.breed}
                    </Badge>
                    {cat.galleryPhotoCount > 0 && (
                      <span className="flex items-center gap-1">
                        <ImageIcon className="h-3 w-3" />
                        {cat.galleryPhotoCount} photo{cat.galleryPhotoCount !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>

                {cat.portraitUrl && (
                  <Badge variant="secondary" className="shrink-0">
                    Has Portrait
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={isRecovering}>
            Dismiss
          </Button>
          <Button
            onClick={handleRecover}
            disabled={selectedCatIds.size === 0 || isRecovering}
          >
            {isRecovering ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Recovering...
              </>
            ) : (
              `Recover ${selectedCatIds.size} Cat${selectedCatIds.size !== 1 ? 's' : ''}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
