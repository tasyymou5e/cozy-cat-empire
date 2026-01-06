import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Lock, Gift, Star, Crown, Clock, Sparkles, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { useBattlePass } from '@/hooks/useBattlePass';
import { BattlePassReward, getSeasonTimeRemaining, XP_SOURCES } from '@/types/battlePass';

interface BattlePassPanelProps {
  money: number;
  onClaimReward: (reward: BattlePassReward) => void;
  onUpgradePremium: () => void;
}

export function BattlePassPanel({ money, onClaimReward, onUpgradePremium }: BattlePassPanelProps) {
  const { battlePass, season, xpProgress, claimReward, canClaimReward, getUnclaimedRewards, allRewards, upgradeToPremium } = useBattlePass();
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [viewTier, setViewTier] = useState(battlePass.currentTier);
  
  const timeRemaining = getSeasonTimeRemaining(season.endsAt);
  const unclaimedCount = getUnclaimedRewards().length;
  
  const handleClaimReward = (rewardId: string) => {
    const reward = claimReward(rewardId);
    if (reward) {
      onClaimReward(reward);
    }
  };
  
  const handleUpgrade = () => {
    if (money >= 500) {
      upgradeToPremium();
      onUpgradePremium();
      setShowUpgradeDialog(false);
    }
  };
  
  const tierRewards = allRewards.filter(r => r.tier === viewTier);
  const freeReward = tierRewards.find(r => !r.isPremium);
  const premiumReward = tierRewards.find(r => r.isPremium);
  
  const RewardCard = ({ reward, isPremiumLocked }: { reward: BattlePassReward; isPremiumLocked: boolean }) => {
    const isClaimed = battlePass.claimedRewards.includes(reward.id);
    const canClaim = canClaimReward(reward.id);
    const isLocked = reward.tier > battlePass.currentTier;
    
    return (
      <div className={`relative p-3 rounded-lg border-2 transition-all ${
        isClaimed 
          ? 'bg-muted/50 border-muted' 
          : canClaim 
            ? 'bg-primary/10 border-primary animate-pulse' 
            : isLocked || isPremiumLocked
              ? 'bg-muted/30 border-muted/50'
              : 'bg-card border-border'
      }`}>
        {isPremiumLocked && !battlePass.isPremium && (
          <div className="absolute inset-0 bg-background/80 rounded-lg flex items-center justify-center z-10">
            <Lock className="w-6 h-6 text-muted-foreground" />
          </div>
        )}
        
        <div className="flex flex-col items-center gap-2">
          <span className="text-2xl">{reward.emoji}</span>
          <span className="text-xs font-medium text-center">{reward.name}</span>
          
          {isClaimed ? (
            <Badge variant="secondary" className="gap-1">
              <Check className="w-3 h-3" /> Claimed
            </Badge>
          ) : canClaim ? (
            <Button size="sm" onClick={() => handleClaimReward(reward.id)} className="gap-1">
              <Gift className="w-3 h-3" /> Claim
            </Button>
          ) : isLocked ? (
            <Badge variant="outline" className="gap-1">
              <Lock className="w-3 h-3" /> Tier {reward.tier}
            </Badge>
          ) : null}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Season Header */}
      <Card className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-blue-500/30">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-3xl">{season.emoji}</span>
              <div>
                <CardTitle className="text-lg">{season.name}</CardTitle>
                <p className="text-sm text-muted-foreground">Season Pass</p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                {timeRemaining.isExpired ? (
                  <span className="text-destructive">Season Ended</span>
                ) : (
                  <span>{timeRemaining.days}d {timeRemaining.hours}h remaining</span>
                )}
              </div>
              {battlePass.isPremium && (
                <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 gap-1">
                  <Crown className="w-3 h-3" /> Premium
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* XP Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Tier {battlePass.currentTier}</span>
              <span className="text-muted-foreground">
                {xpProgress.current} / {xpProgress.required} XP
              </span>
            </div>
            <Progress value={xpProgress.percentage} className="h-3" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Total XP: {battlePass.currentXP}</span>
              <span>Max Tier: {season.maxTier}</span>
            </div>
          </div>
          
          {/* Unclaimed notification */}
          {unclaimedCount > 0 && (
            <div className="mt-3 p-2 bg-primary/20 rounded-lg flex items-center justify-between">
              <span className="text-sm font-medium flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                {unclaimedCount} reward{unclaimedCount > 1 ? 's' : ''} ready to claim!
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Premium Upgrade */}
      {!battlePass.isPremium && (
        <Card className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Crown className="w-8 h-8 text-amber-500" />
                <div>
                  <p className="font-semibold">Upgrade to Premium</p>
                  <p className="text-sm text-muted-foreground">Unlock exclusive rewards & costumes!</p>
                </div>
              </div>
              <Button 
                onClick={() => setShowUpgradeDialog(true)}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
              >
                500 💰 Upgrade
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tier Navigation */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Reward Track</CardTitle>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="icon"
                disabled={viewTier <= 1}
                onClick={() => setViewTier(v => Math.max(1, v - 1))}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Badge variant="secondary" className="px-3">
                Tier {viewTier}
              </Badge>
              <Button 
                variant="outline" 
                size="icon"
                disabled={viewTier >= season.maxTier}
                onClick={() => setViewTier(v => Math.min(season.maxTier, v + 1))}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {/* Free Track */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Star className="w-4 h-4" />
                Free Track
              </div>
              {freeReward && (
                <RewardCard reward={freeReward} isPremiumLocked={false} />
              )}
            </div>
            
            {/* Premium Track */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-amber-500">
                <Crown className="w-4 h-4" />
                Premium Track
              </div>
              {premiumReward && (
                <RewardCard reward={premiumReward} isPremiumLocked={!battlePass.isPremium} />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* XP Sources */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            How to Earn XP
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {Object.entries(XP_SOURCES).map(([source, xp]) => (
              <div key={source} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                <span className="capitalize">{source.replace(/_/g, ' ')}</span>
                <Badge variant="secondary">+{xp} XP</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* All Tiers Overview */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">All Tiers</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-48">
            <div className="space-y-2">
              {Array.from({ length: season.maxTier }, (_, i) => i + 1).map(tier => {
                const rewards = allRewards.filter(r => r.tier === tier);
                const isUnlocked = tier <= battlePass.currentTier;
                const isCurrent = tier === battlePass.currentTier;
                
                return (
                  <div 
                    key={tier}
                    onClick={() => setViewTier(tier)}
                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                      isCurrent 
                        ? 'bg-primary/20 border border-primary' 
                        : isUnlocked 
                          ? 'bg-muted/50 hover:bg-muted' 
                          : 'bg-muted/20 hover:bg-muted/30'
                    }`}
                  >
                    <Badge variant={isUnlocked ? "default" : "outline"} className="w-12 justify-center">
                      {tier}
                    </Badge>
                    <div className="flex-1 flex items-center gap-2">
                      {rewards.map(r => (
                        <span 
                          key={r.id} 
                          className={`text-lg ${r.isPremium && !battlePass.isPremium ? 'opacity-50' : ''}`}
                          title={r.name}
                        >
                          {r.emoji}
                        </span>
                      ))}
                    </div>
                    {!isUnlocked && <Lock className="w-4 h-4 text-muted-foreground" />}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Premium Upgrade Dialog */}
      <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-500" />
              Upgrade to Premium
            </DialogTitle>
            <DialogDescription>
              Unlock exclusive premium rewards for this season!
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-lg">
              <h4 className="font-semibold mb-2">Premium Benefits:</h4>
              <ul className="space-y-1 text-sm">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  Exclusive costumes & cosmetics
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  Unique titles & badges
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  Bonus coins & resources
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  Access to all {season.maxTier} premium rewards
                </li>
              </ul>
            </div>
            
            <div className="text-center">
              <p className="text-2xl font-bold">500 💰</p>
              <p className="text-sm text-muted-foreground">Your balance: {money} coins</p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpgradeDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpgrade}
              disabled={money < 500}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
            >
              <Crown className="w-4 h-4 mr-2" />
              Upgrade Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
