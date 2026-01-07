import React from 'react';
import { Cat, HOUSE_UPGRADES } from '@/types/game';
import { CatRelationship } from '@/types/relationships';
import {
  ShowTier,
  getSeason,
  SEASONS,
  getCurrentSeasonalEvent,
  getSpecialEvent,
} from '@/types/showEvents';
import { CatShowPanel } from './CatShowPanel';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface CompactStatusBarProps {
  day: number;
  money: number;
  cats: Cat[];
  space: number;
  houseSize: 'apartment' | 'house' | 'mansion' | 'farm';
  acres: number;
  totalShowWins: number;
  showCooldown: number;
  onUpgrade: () => void;
  onCatShow: (tier: ShowTier) => void;
  relationships?: CatRelationship[];
}

const houseEmojis: Record<string, string> = {
  apartment: '🏢',
  house: '🏡',
  mansion: '🏰',
  farm: '🌾',
};

/**
 * CompactStatusBar - A streamlined status bar for the new sidebar layout
 * Shows cats, home, show wins, and relationship summary in a compact format
 */
export const CompactStatusBar = React.forwardRef<HTMLDivElement, CompactStatusBarProps>(
  function CompactStatusBar(
    {
      day,
      money,
      cats,
      space,
      houseSize,
      acres,
      totalShowWins,
      showCooldown,
      onUpgrade,
      onCatShow,
      relationships = [],
    },
    ref
  ) {
    let nextCost: number;
    let canUpgrade: boolean;

    if (houseSize === 'farm') {
      nextCost = 5000 * (acres + 1);
      canUpgrade = money >= nextCost && acres < 100;
    } else {
      const upgrade = HOUSE_UPGRADES[houseSize];
      nextCost = upgrade.cost;
      canUpgrade = money >= nextCost;
    }

    // Season info
    const season = getSeason(day);
    const seasonInfo = SEASONS[season];
    const seasonalEvent = getCurrentSeasonalEvent(day);
    const specialEvent = getSpecialEvent(day);

    // Relationship stats
    const friendCount = relationships.filter((r) => r.score >= 20).length;
    const rivalCount = relationships.filter((r) => r.score <= -20).length;

    return (
      <div
        ref={ref}
        className="bg-muted/30 border-b border-border px-4 py-2 flex items-center justify-between gap-4 overflow-x-auto scrollbar-hide"
      >
        {/* Left: Core Stats */}
        <div className="flex items-center gap-4 shrink-0">
          {/* Season */}
          <div className="flex items-center gap-1.5">
            <span>{seasonInfo.emoji}</span>
            <span className="text-sm font-medium">{seasonInfo.name}</span>
            {(seasonalEvent || specialEvent) && (
              <Badge variant="secondary" className="text-[10px] px-1 animate-pulse">
                {seasonalEvent?.emoji || specialEvent?.emoji} Event!
              </Badge>
            )}
          </div>

          {/* Cats */}
          <div className="flex items-center gap-1.5">
            <span>🐱</span>
            <span className="text-sm font-medium">
              {cats.length}/{space}
            </span>
            <Progress value={(cats.length / space) * 100} className="w-12 h-1.5" />
          </div>

          {/* Home */}
          <div className="flex items-center gap-1.5">
            <span>{houseEmojis[houseSize]}</span>
            <span className="text-sm font-medium capitalize">
              {houseSize}
              {houseSize === 'farm' && ` (${acres}ac)`}
            </span>
            <Button
              size="sm"
              variant={canUpgrade ? 'default' : 'ghost'}
              onClick={onUpgrade}
              disabled={!canUpgrade}
              className="h-6 text-xs px-2"
            >
              ${nextCost}
            </Button>
          </div>

          {/* Show Wins */}
          <div className="flex items-center gap-1.5">
            <span>🏆</span>
            <span className="text-sm font-medium">{totalShowWins}</span>
          </div>

          {/* Social */}
          <div className="flex items-center gap-1">
            <Badge variant="outline" className="text-xs bg-green-50 text-green-600 border-green-200 px-1 h-5">
              💚{friendCount}
            </Badge>
            <Badge variant="outline" className="text-xs bg-red-50 text-red-600 border-red-200 px-1 h-5">
              😾{rivalCount}
            </Badge>
          </div>
        </div>

        {/* Right: Cat Show */}
        <div className="shrink-0">
          <CatShowPanel
            day={day}
            totalShowWins={totalShowWins}
            showCooldown={showCooldown}
            cats={cats}
            money={money}
            onEnterShow={onCatShow}
          />
        </div>
      </div>
    );
  }
);

CompactStatusBar.displayName = 'CompactStatusBar';
