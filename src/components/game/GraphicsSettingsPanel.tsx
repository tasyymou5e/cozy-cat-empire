/**
 * GraphicsSettingsPanel - User interface for graphics settings
 *
 * Allows users to toggle costume animations, particle effects,
 * tier glows, and other visual features.
 */

import React from 'react';
import { useGraphicsSettings } from '@/hooks/useGraphicsSettings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Palette, Gauge, Sparkles, Image, RotateCcw, Eye } from 'lucide-react';

export function GraphicsSettingsPanel() {
  const { settings, updateSetting, resetToDefaults, isReducedMotion, effectiveAnimations } =
    useGraphicsSettings();

  return (
    <Card className="border-accent/30">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Palette className="h-5 w-5 text-primary" />
          Graphics Settings
        </CardTitle>
        <CardDescription>Customize visual effects and performance</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Performance Section */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm flex items-center gap-2 text-muted-foreground">
            <Gauge className="h-4 w-4" /> Performance
          </h4>

          {/* Avatar Quality */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm">Avatar Quality</Label>
              <p className="text-xs text-muted-foreground">Higher quality uses more resources</p>
            </div>
            <Select
              value={settings.avatarQuality}
              onValueChange={(v: 'low' | 'medium' | 'high') => updateSetting('avatarQuality', v)}
            >
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Enable Animations */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm">Enable Animations</Label>
              <p className="text-xs text-muted-foreground">Breathing, blinking, micro-animations</p>
            </div>
            <Switch
              checked={settings.enableAnimations}
              onCheckedChange={(v) => updateSetting('enableAnimations', v)}
            />
          </div>

          {/* Reduced Motion Override */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm">Force Reduced Motion</Label>
              <p className="text-xs text-muted-foreground">Minimize all animations</p>
            </div>
            <Switch
              checked={settings.enableReducedMotion}
              onCheckedChange={(v) => updateSetting('enableReducedMotion', v)}
            />
          </div>
        </div>

        <Separator />

        {/* Effects Section */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm flex items-center gap-2 text-muted-foreground">
            <Sparkles className="h-4 w-4" /> Effects
          </h4>

          {/* Costume Animations */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm">Costume Animations</Label>
              <p className="text-xs text-muted-foreground">Sparkles, glows, flowing effects</p>
            </div>
            <Switch
              checked={settings.enableCostumeAnimations}
              onCheckedChange={(v) => updateSetting('enableCostumeAnimations', v)}
            />
          </div>

          {/* Particle Effects */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm">Particle Effects</Label>
              <p className="text-xs text-muted-foreground">Floating sparkles and magic particles</p>
            </div>
            <Switch
              checked={settings.enableParticles}
              onCheckedChange={(v) => updateSetting('enableParticles', v)}
            />
          </div>

          {/* Tier Glows */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm">Tier Glows</Label>
              <p className="text-xs text-muted-foreground">Glowing borders on rare cats</p>
            </div>
            <Switch
              checked={settings.enableTierGlows}
              onCheckedChange={(v) => updateSetting('enableTierGlows', v)}
            />
          </div>

          {/* Sparkle Effects */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm">Sparkle Effects</Label>
              <p className="text-xs text-muted-foreground">Ultra rare cat sparkle particles</p>
            </div>
            <Switch
              checked={settings.enableSparkles}
              onCheckedChange={(v) => updateSetting('enableSparkles', v)}
            />
          </div>

          {/* Card Flip */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm">Card Flip Animation</Label>
              <p className="text-xs text-muted-foreground">3D flip effect on trading cards</p>
            </div>
            <Switch
              checked={settings.enableCardFlip}
              onCheckedChange={(v) => updateSetting('enableCardFlip', v)}
            />
          </div>
        </div>

        <Separator />

        {/* Display Section */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm flex items-center gap-2 text-muted-foreground">
            <Eye className="h-4 w-4" /> Display
          </h4>

          {/* Card Border Style */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm">Card Border Style</Label>
              <p className="text-xs text-muted-foreground">How cat card borders appear</p>
            </div>
            <Select
              value={settings.cardBorderStyle}
              onValueChange={(v: 'tier' | 'simple' | 'none') => updateSetting('cardBorderStyle', v)}
            >
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tier">By Tier</SelectItem>
                <SelectItem value="simple">Simple</SelectItem>
                <SelectItem value="none">None</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Portrait Priority */}
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

          {/* Show Costume on Portrait */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm">Show Costume on Portrait</Label>
              <p className="text-xs text-muted-foreground">Display costume badge on AI portraits</p>
            </div>
            <Switch
              checked={settings.showCostumeOnPortrait}
              onCheckedChange={(v) => updateSetting('showCostumeOnPortrait', v)}
            />
          </div>

          {/* Costume Display Mode */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm">Costume Rendering</Label>
              <p className="text-xs text-muted-foreground">How costumes are displayed</p>
            </div>
            <Select
              value={settings.costumeDisplayMode}
              onValueChange={(v: 'vector' | 'emoji' | 'auto') =>
                updateSetting('costumeDisplayMode', v)
              }
            >
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto</SelectItem>
                <SelectItem value="vector">Vector</SelectItem>
                <SelectItem value="emoji">Emoji</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator />

        {/* Footer */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex gap-2">
            {isReducedMotion && (
              <Badge variant="outline" className="text-xs">
                System: Reduced Motion
              </Badge>
            )}
            {!effectiveAnimations && settings.enableAnimations && (
              <Badge variant="secondary" className="text-xs">
                Animations Disabled
              </Badge>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={resetToDefaults}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default GraphicsSettingsPanel;
