import { useState } from 'react';
import { Cat } from '@/types/game';
import {
  SHOW_TIERS,
  ShowTier,
  ShowTierInfo,
  getSeason,
  getCurrentSeasonalEvent,
  getSpecialEvent,
  getAvailableTiers,
  SEASONS,
} from '@/types/showEvents';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Star, Sparkles } from 'lucide-react';

interface CatShowPanelProps {
  day: number;
  totalShowWins: number;
  showCooldown: number;
  cats: Cat[];
  money: number;
  onEnterShow: (tier: ShowTier) => void;
}

export function CatShowPanel({
  day,
  totalShowWins,
  showCooldown,
  cats,
  money,
  onEnterShow,
}: CatShowPanelProps) {
  const [selectedTier, setSelectedTier] = useState<ShowTier>('local');
  const [isOpen, setIsOpen] = useState(false);

  const season = getSeason(day);
  const seasonInfo = SEASONS[season];
  const seasonalEvent = getCurrentSeasonalEvent(day);
  const specialEvent = getSpecialEvent(day);
  const availableTiers = getAvailableTiers(totalShowWins);
  const showAvailable = showCooldown === 0;

  const eligibleCats = cats.filter((c) => c.health >= 70 && c.happiness >= 60);

  const getEligibleForTier = (tier: ShowTierInfo) => {
    return eligibleCats.filter((c) => c.grade >= tier.minGrade);
  };

  const currentTier = SHOW_TIERS.find((t) => t.id === selectedTier)!;
  const eligibleForSelected = getEligibleForTier(currentTier);
  const canAffordEntry = money >= currentTier.entryFee;

  const handleEnterShow = () => {
    onEnterShow(selectedTier);
    setIsOpen(false);
  };

  // Calculate total bonus
  let totalBonus = currentTier.rewardMultiplier;
  if (seasonalEvent) totalBonus *= seasonalEvent.bonusMultiplier;
  if (specialEvent) totalBonus *= specialEvent.bonusMultiplier;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button disabled={!showAvailable || eligibleCats.length === 0} className="cat-show-button">
          {showAvailable ? (
            <span className="flex items-center gap-2">
              🎪 Cat Show
              {(seasonalEvent || specialEvent) && <Sparkles className="h-4 w-4 text-yellow-300" />}
              <Badge variant="secondary" className="ml-1">
                {eligibleCats.length} eligible
              </Badge>
            </span>
          ) : (
            <>🎪 Next Show in {showCooldown} days</>
          )}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Cat Show Arena
          </DialogTitle>
        </DialogHeader>

        {/* Season & Event Banner */}
        <div className="flex items-center gap-2 p-3 rounded-lg bg-accent/30">
          <span className="text-2xl">{seasonInfo.emoji}</span>
          <div className="flex-1">
            <p className="font-medium">{seasonInfo.name} Season</p>
            <p className="text-xs text-muted-foreground">Day {day}</p>
          </div>
          {seasonalEvent && (
            <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-primary-foreground dark:text-foreground">
              {seasonalEvent.emoji} {seasonalEvent.name}
            </Badge>
          )}
          {specialEvent && (
            <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-primary-foreground dark:text-foreground animate-pulse">
              {specialEvent.emoji} {specialEvent.name}
            </Badge>
          )}
        </div>

        {/* Event Bonus Info */}
        {(seasonalEvent || specialEvent) && (
          <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
            <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
              🎉 Special Event Active!
            </p>
            <p className="text-xs text-muted-foreground">
              {seasonalEvent && seasonalEvent.description}
              {seasonalEvent && specialEvent && ' '}
              {specialEvent && specialEvent.description}
            </p>
          </div>
        )}

        {/* Tier Selection */}
        <div className="space-y-3">
          <h4 className="font-medium flex items-center gap-2">
            <Star className="h-4 w-4" /> Select Show Tier
          </h4>
          <Tabs value={selectedTier} onValueChange={(v) => setSelectedTier(v as ShowTier)}>
            <TabsList className="grid w-full grid-cols-4">
              {SHOW_TIERS.map((tier) => {
                const unlocked = availableTiers.find((t) => t.id === tier.id);
                const eligible = getEligibleForTier(tier).length;
                return (
                  <TabsTrigger
                    key={tier.id}
                    value={tier.id}
                    disabled={!unlocked}
                    className="relative"
                  >
                    <span className="mr-1">{tier.emoji}</span>
                    <span className="hidden sm:inline">{tier.name.split(' ')[0]}</span>
                    {eligible > 0 && (
                      <Badge variant="secondary" className="ml-1 text-[10px] px-1">
                        {eligible}
                      </Badge>
                    )}
                    {!unlocked && <span className="absolute -top-1 -right-1 text-[10px]">🔒</span>}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {SHOW_TIERS.map((tier) => (
              <TabsContent key={tier.id} value={tier.id} className="mt-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {tier.emoji} {tier.name}
                      <Badge variant="outline">{tier.rewardMultiplier}x Rewards</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">{tier.description}</p>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="p-2 rounded bg-accent/30">
                        <p className="text-muted-foreground text-xs">Min Grade</p>
                        <p className="font-bold">{tier.minGrade}+</p>
                      </div>
                      <div className="p-2 rounded bg-accent/30">
                        <p className="text-muted-foreground text-xs">Entry Fee</p>
                        <p className="font-bold">${tier.entryFee}</p>
                      </div>
                      <div className="p-2 rounded bg-accent/30">
                        <p className="text-muted-foreground text-xs">Wins Required</p>
                        <p className="font-bold">{tier.minWins}+ wins</p>
                      </div>
                      <div className="p-2 rounded bg-accent/30">
                        <p className="text-muted-foreground text-xs">Eligible Cats</p>
                        <p className="font-bold">{getEligibleForTier(tier).length}</p>
                      </div>
                    </div>

                    {/* Total Bonus Display */}
                    <div className="p-3 rounded-lg bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Total Reward Multiplier</span>
                        <span className="text-lg font-bold text-green-600 dark:text-green-400">
                          {totalBonus.toFixed(1)}x
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Base {tier.rewardMultiplier}x
                        {seasonalEvent &&
                          ` × ${seasonalEvent.bonusMultiplier}x (${seasonalEvent.name})`}
                        {specialEvent &&
                          ` × ${specialEvent.bonusMultiplier}x (${specialEvent.name})`}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </div>

        {/* Enter Button */}
        <div className="flex items-center justify-between pt-2">
          <div className="text-sm text-muted-foreground">
            Your wins: <span className="font-bold">{totalShowWins}</span>
          </div>
          <Button
            onClick={handleEnterShow}
            disabled={eligibleForSelected.length === 0 || !canAffordEntry}
            className="min-w-[150px]"
          >
            {!canAffordEntry ? (
              `Need $${currentTier.entryFee}`
            ) : eligibleForSelected.length === 0 ? (
              `Need Grade ${currentTier.minGrade}+`
            ) : (
              <>Enter Show ({eligibleForSelected.length} cats)</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
