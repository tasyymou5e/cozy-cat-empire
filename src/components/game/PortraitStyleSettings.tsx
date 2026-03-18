/**
 * PortraitStyleSettings - Dialog for global portrait style preferences
 * and one-click upgrade for existing portraits.
 */

import React, { useState, useMemo } from 'react';
import { Cat } from '@/types/game';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Sparkles, ImageIcon, Wand2, ArrowUpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePortraitStyle } from '@/hooks/usePortraitStyle';
import { useGraphicsSettings } from '@/hooks/useGraphicsSettings';
import { PORTRAIT_STYLES, type PortraitStyle } from '@/config/portraitSettings';

interface PortraitStyleSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cats?: Cat[];
  onUpgradeAll?: (style: PortraitStyle) => void;
}

export function PortraitStyleSettings({
  open,
  onOpenChange,
  cats = [],
  onUpgradeAll,
}: PortraitStyleSettingsProps) {
  const { globalDefault, setGlobalDefault } = usePortraitStyle();
  const { settings, updateSetting } = useGraphicsSettings();
  const [pendingStyle, setPendingStyle] = useState<PortraitStyle>(globalDefault);

  const catsWithDifferentStyle = useMemo(() => {
    return cats.filter(
      (cat) => cat.portraitUrl && cat.portraitStyle && cat.portraitStyle !== pendingStyle
    );
  }, [cats, pendingStyle]);

  const handleSave = () => {
    setGlobalDefault(pendingStyle);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-primary" />
            Portrait Settings
          </DialogTitle>
          <DialogDescription>Configure default portrait style and animations</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Default Style */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Default Style</Label>
            <div className="flex gap-2">
              {Object.entries(PORTRAIT_STYLES).map(([key, meta]) => (
                <Button
                  key={key}
                  variant={pendingStyle === key ? 'default' : 'outline'}
                  size="sm"
                  className={cn('flex-1 gap-2', pendingStyle === key && 'shadow-md')}
                  onClick={() => setPendingStyle(key as PortraitStyle)}
                >
                  <span>{meta.icon}</span>
                  {meta.label}
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {PORTRAIT_STYLES[pendingStyle].description}
            </p>
          </div>

          <Separator />

          {/* Micro-Interactions Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm">Micro-Interactions</Label>
              <p className="text-xs text-muted-foreground">
                Breathing, blinking, and whisker animations
              </p>
            </div>
            <Switch
              checked={settings.enableMicroAnimations}
              onCheckedChange={(v) => updateSetting('enableMicroAnimations', v)}
            />
          </div>

          <Separator />

          {/* Prefer AI Portraits */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm">Prefer AI Portraits</Label>
              <p className="text-xs text-muted-foreground">Show AI portraits when available</p>
            </div>
            <Switch
              checked={settings.enablePortraitPriority}
              onCheckedChange={(v) => updateSetting('enablePortraitPriority', v)}
            />
          </div>

          {/* One-Click Upgrade */}
          {catsWithDifferentStyle.length > 0 && onUpgradeAll && (
            <>
              <Separator />
              <div className="space-y-3 p-3 bg-muted/50 rounded-lg border border-border">
                <div className="flex items-center gap-2">
                  <ArrowUpCircle className="h-4 w-4 text-primary" />
                  <Label className="text-sm font-medium">One-Click Upgrade</Label>
                </div>
                <p className="text-xs text-muted-foreground">
                  You have {catsWithDifferentStyle.length} cat
                  {catsWithDifferentStyle.length !== 1 ? 's' : ''} with{' '}
                  {pendingStyle === 'realistic' ? 'kawaii' : 'realistic'} portraits. Regenerate
                  them in {PORTRAIT_STYLES[pendingStyle].label.toLowerCase()} style?
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2"
                  onClick={() => {
                    onUpgradeAll(pendingStyle);
                    onOpenChange(false);
                  }}
                >
                  <Wand2 className="h-4 w-4" />
                  Upgrade All to {PORTRAIT_STYLES[pendingStyle].label}
                  <Badge variant="secondary" className="ml-1">
                    <Sparkles className="h-3 w-3 mr-1" />
                    {catsWithDifferentStyle.length} credits
                  </Badge>
                </Button>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Settings</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default PortraitStyleSettings;
