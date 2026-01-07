import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles } from 'lucide-react';
import { CHANGELOG, CURRENT_VERSION, ChangelogEntry } from '@/types/changelog';
import { cn } from '@/lib/utils';

interface WhatsNewPopupProps {
  open: boolean;
  onClose: () => void;
}

const categoryStyles = {
  major: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  feature: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  improvement: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
};

const versionBgStyles = {
  major:
    'bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200 dark:border-purple-800',
  feature:
    'bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-blue-200 dark:border-blue-800',
  improvement:
    'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800',
};

function getNewEntries(lastSeenVersion: string | null): ChangelogEntry[] {
  if (!lastSeenVersion) {
    // First time seeing this feature - show last 2 versions
    return CHANGELOG.slice(0, 2);
  }

  const lastSeenIndex = CHANGELOG.findIndex((entry) => entry.version === lastSeenVersion);

  if (lastSeenIndex === -1) {
    // Version not found - show all newer than oldest known
    return CHANGELOG.slice(0, 2);
  }

  if (lastSeenIndex === 0) {
    // Already seen latest
    return [];
  }

  // Return all entries newer than last seen
  return CHANGELOG.slice(0, lastSeenIndex);
}

export function WhatsNewPopup({ open, onClose }: WhatsNewPopupProps) {
  const [entries, setEntries] = useState<ChangelogEntry[]>([]);

  useEffect(() => {
    if (open) {
      const lastSeenVersion = localStorage.getItem('cat-farm-last-seen-version');
      setEntries(getNewEntries(lastSeenVersion));
    }
  }, [open]);

  const handleClose = () => {
    localStorage.setItem('cat-farm-last-seen-version', CURRENT_VERSION);
    onClose();
  };

  // Don't show if no new entries
  if (entries.length === 0 && open) {
    handleClose();
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader className="text-center sm:text-left">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="h-5 w-5 text-yellow-500 animate-pulse" />
            What's New in Cat Farm!
          </DialogTitle>
          <DialogDescription>Here's what we've added since your last visit</DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4 -mr-4">
          <div className="space-y-4 py-2">
            {entries.map((entry) => (
              <div
                key={entry.version}
                className={cn(
                  'rounded-lg border p-4 transition-all',
                  versionBgStyles[entry.category]
                )}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">{entry.emoji}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-foreground">{entry.title}</h3>
                      <Badge
                        variant="secondary"
                        className={cn('text-[10px]', categoryStyles[entry.category])}
                      >
                        v{entry.version}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{entry.date}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  {entry.highlights.map((highlight, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2 text-sm bg-background/50 rounded-md p-2"
                    >
                      <span className="text-base flex-shrink-0">{highlight.emoji}</span>
                      <div>
                        <span className="font-medium text-foreground">{highlight.title}</span>
                        <span className="text-muted-foreground"> — {highlight.description}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="pt-4 border-t">
          <Button onClick={handleClose} className="w-full">
            <Sparkles className="h-4 w-4 mr-2" />
            Got it, let's play!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
