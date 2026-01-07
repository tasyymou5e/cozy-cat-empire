import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SHORTCUTS } from '@/hooks/useKeyboardShortcuts';
import { Keyboard } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface KeyboardShortcutsHelpProps {
  open: boolean;
  onClose: () => void;
}

// Group shortcuts by category
const SHORTCUT_GROUPS = {
  'Core Actions': ['F', 'N', 'S'],
  Navigation: ['H', 'C', 'G', 'P', 'R', 'L'],
  'Quick Tabs': ['T', 'B', 'M', 'O', 'W'],
  Other: ['1-8', '?'],
};

export function KeyboardShortcutsHelp({ open, onClose }: KeyboardShortcutsHelpProps) {
  const shortcutMap = new Map(SHORTCUTS.map((s) => [s.key, s.description]));

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4">
            {Object.entries(SHORTCUT_GROUPS).map(([group, keys], index) => (
              <div key={group}>
                {index > 0 && <Separator className="mb-4" />}
                <h4 className="text-sm font-medium text-muted-foreground mb-2">{group}</h4>
                <div className="space-y-1">
                  {keys.map((key) => {
                    const description = shortcutMap.get(key);
                    if (!description) return null;
                    return (
                      <div key={key} className="flex items-center justify-between py-1.5">
                        <span className="text-sm text-foreground">{description}</span>
                        <kbd className="px-2 py-1 text-xs font-mono bg-muted rounded border border-border">
                          {key}
                        </kbd>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <p className="text-xs text-muted-foreground text-center mt-2">
          Press <kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">?</kbd> anytime to show
          this help
        </p>
      </DialogContent>
    </Dialog>
  );
}
