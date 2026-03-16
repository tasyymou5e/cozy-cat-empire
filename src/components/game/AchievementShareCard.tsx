/**
 * @fileoverview Achievement sharing card component
 *
 * Creates a shareable visual card when players unlock achievements or milestones.
 * Supports copy-to-clipboard and download.
 *
 * @module components/game/AchievementShareCard
 */

import { useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Share2, Download, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface ShareableAchievement {
  name: string;
  description: string;
  emoji: string;
  category?: string;
  playerName?: string;
  date?: string;
}

interface AchievementShareCardProps {
  achievement: ShareableAchievement | null;
  open: boolean;
  onClose: () => void;
}

export function AchievementShareCard({ achievement, open, onClose }: AchievementShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopyText = useCallback(async () => {
    if (!achievement) return;
    const text = `🏆 I just unlocked "${achievement.name}" in Cat Farm! ${achievement.emoji}\n${achievement.description}\n\nPlay at: cozy-cat-empire.lovable.app`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast({ title: 'Copied!', description: 'Achievement text copied to clipboard' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: 'Copy failed', variant: 'destructive' });
    }
  }, [achievement, toast]);

  const handleShare = useCallback(async () => {
    if (!achievement) return;
    const shareData = {
      title: `Cat Farm - ${achievement.name}`,
      text: `🏆 I just unlocked "${achievement.name}"! ${achievement.emoji} ${achievement.description}`,
      url: 'https://cozy-cat-empire.lovable.app',
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        handleCopyText();
      }
    } catch {
      // User cancelled share
    }
  }, [achievement, handleCopyText]);

  if (!achievement) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Achievement
          </DialogTitle>
        </DialogHeader>

        {/* Visual Card */}
        <div
          ref={cardRef}
          className="relative overflow-hidden rounded-xl border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-background to-accent/10 p-6"
        >
          <div className="absolute top-2 right-2 text-4xl opacity-20">🏆</div>
          <div className="text-center space-y-3">
            <div className="text-5xl">{achievement.emoji}</div>
            <div className="text-xl font-bold text-foreground">{achievement.name}</div>
            <div className="text-sm text-muted-foreground">{achievement.description}</div>
            {achievement.playerName && (
              <div className="text-xs text-muted-foreground pt-2 border-t border-border">
                Unlocked by <span className="font-medium text-foreground">{achievement.playerName}</span>
              </div>
            )}
            <div className="text-xs text-muted-foreground/60 font-medium">
              🐱 Cat Farm • cozy-cat-empire.lovable.app
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={handleCopyText}>
            {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
            {copied ? 'Copied!' : 'Copy Text'}
          </Button>
          <Button className="flex-1" onClick={handleShare}>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
