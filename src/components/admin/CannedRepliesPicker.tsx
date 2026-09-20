/**
 * Popover listing canned reply templates. Selecting one inserts the rendered
 * text into the admin reply composer (append if the draft is non-empty).
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Zap } from 'lucide-react';
import { CANNED_REPLIES, renderCannedReply } from '@/lib/cannedReplies';

interface CannedRepliesPickerProps {
  /** Player name used for the `{player}` placeholder. */
  playerName: string;
  /** Current draft text. */
  draft: string;
  /** Called with the new draft text after insertion. */
  onInsert: (text: string) => void;
  disabled?: boolean;
}

export function CannedRepliesPicker({ playerName, draft, onInsert, disabled }: CannedRepliesPickerProps) {
  const [open, setOpen] = useState(false);

  const insert = (body: string) => {
    const rendered = renderCannedReply(body, playerName);
    const next = draft.trim() ? `${draft.trimEnd()}\n\n${rendered}` : rendered;
    onInsert(next.slice(0, 4000));
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          aria-label="Insert a canned reply"
          disabled={disabled}
        >
          <Zap className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-2" align="end">
        <p className="px-2 pb-1.5 text-xs font-medium text-muted-foreground">Quick replies</p>
        <ScrollArea className="max-h-72">
          <div className="flex flex-col gap-1">
            {CANNED_REPLIES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => insert(t.body)}
                className="rounded-md px-2 py-1.5 text-left transition-colors hover:bg-accent"
              >
                <span className="block text-sm font-medium">{t.label}</span>
                <span className="line-clamp-2 block text-xs text-muted-foreground">
                  {renderCannedReply(t.body, playerName)}
                </span>
              </button>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
