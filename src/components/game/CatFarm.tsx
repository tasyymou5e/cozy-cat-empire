import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useGameState } from '@/hooks/useGameState';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useConfetti } from '@/hooks/useConfetti';
import { useHaptics } from '@/hooks/useHaptics';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';
import { useCloudSave } from '@/hooks/useCloudSave';
import { useGlobalLeaderboard } from '@/hooks/useGlobalLeaderboard';
import { useWeeklyChallenges } from '@/hooks/useWeeklyChallenges';
import { usePlayerProfile } from '@/hooks/usePlayerProfile';
import { useDailyLoginRewards } from '@/hooks/useDailyLoginRewards';
import { StatusBar } from './StatusBar';
import { MessageBar } from './MessageBar';
import { ActionPanel } from './ActionPanel';
import { ResourcePanel } from './ResourcePanel';
import { ChorePanel } from './ChorePanel';
import { MarketPanel } from './MarketPanel';
import { BreedingPanel } from './BreedingPanel';
import { AchievementsPanel } from './AchievementsPanel';
import { SaveLoadPanel } from './SaveLoadPanel';
import { SocializePanel } from './SocializePanel';
import { RelationshipPanel } from './RelationshipPanel';
import { MatchmakingPanel } from './MatchmakingPanel';
import { GroupActivitiesPanel } from './GroupActivitiesPanel';
import { TrainingPanel } from './TrainingPanel';
import { RelationshipAnimations } from './RelationshipAnimations';
import { MoodAnimations } from './MoodAnimations';
import { CatActivityPopups } from './CatActivityPopups';
import { CatCard } from './CatCard';
import { CatReactionProvider, useCatReactions } from '@/contexts/CatReactionContext';
import { TutorialSystem } from './TutorialSystem';
import { KeyboardShortcutsHelp } from './KeyboardShortcutsHelp';
import { DailyEventToast } from './DailyEventToast';
import { LeaderboardPanel } from './LeaderboardPanel';
import { DailyRewardsPanel } from './DailyRewardsPanel';
import { BulkActionsPanel } from './BulkActionsPanel';
import { GiftReceivedDialog } from './GiftReceivedDialog';
import { TradeReceivedDialog } from './TradeReceivedDialog';
import { useCatGifts } from '@/hooks/useCatGifts';
import { useTrading } from '@/hooks/useTrading';
import { usePlayerActivityLog } from '@/hooks/usePlayerActivityLog';
import { usePortraitOutdatedToast } from '@/hooks/usePortraitOutdatedToast';

import { FriendsPanel } from './FriendsPanel';
import { PlayerProfilePanel } from './PlayerProfilePanel';
import { CostumeShopPanel } from './CostumeShopPanel';
import { CatGiftingPanel } from './CatGiftingPanel';
import { TradingPanel } from './TradingPanel';
import { NotificationCenter } from './NotificationCenter';
import { WeeklyChallengesPanel } from './WeeklyChallengesPanel';
import { WhatsNewPopup } from './WhatsNewPopup';
import { GraphicsSettingsPanel } from './GraphicsSettingsPanel';
import { CURRENT_VERSION } from '@/types/changelog';
import { AnimatedBackground } from '@/components/ui/AnimatedBackground';
import { CatGridSkeleton } from './CatGridSkeleton';
import { PanelSkeleton } from './PanelSkeleton';
import { StatusBarSkeleton } from './StatusBarSkeleton';
import { Skeleton } from '@/components/ui/skeleton';
import { FloatingDecorations } from '@/components/ui/FloatingDecorations';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Slider } from '@/components/ui/slider';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Volume2, VolumeX, Music, Music2, Settings2, LayoutGrid, Keyboard, LogIn, LogOut, User, Cloud, CloudOff, Globe, Users, Gift, ArrowLeftRight, Sun, Moon, BarChart3, Target, CalendarDays, Sparkles } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Resources } from '@/types/game';

const MOOD_LABELS = {
  morning: '🌅 Morning',
  afternoon: '☀️ Afternoon', 
  evening: '🌆 Evening',
  night: '🌙 Night',
  celebration: '🎉 Celebration',
  tense: '⚡ Tense',
};

/**
 * CatFarm - Main game orchestrator component
 * 
 * The central hub that manages all game panels, state, and interactions.
 * Handles cloud saves, achievements, daily rewards, notifications, and
 * coordinates between all sub-panels.
 * 
 * @example
 * ```tsx
 * <CatFarm />
 * ```
 * 
 * @remarks
 * - Requires AuthProvider, SoundProvider, and CatReactionProvider as ancestors
 * - Automatically loads cloud save on login
 * - Auto-saves every 5 minutes when logged in
 * - Manages 16-tab sidebar layout for different game features
 */
export function CatFarm() {
  const { 
    playSound, setEnabled, isEnabled, setVolume, getVolume,
    startMusic, stopMusic, isMusicPlaying, setMusicVolume,
    updateMusicForDay, getCurrentMood, triggerCelebration, triggerTense 
  } = useSoundEffects();
  const { fireConfetti, fireCelebration, fireStars, fireChallengeBurst } = useConfetti();
  const { vibrateProgress, vibrateComplete, vibrateAchievement } = useHaptics();
  const { user, signOut, loading: authLoading } = useAuth();
  const { logActivity } = usePlayerActivityLog(user?.id);
  const { 
    challenges, loading: challengesLoading, updateProgress: updateChallengeProgress, 
    claimReward, getTimeRemaining, lastProgressUpdate, clearProgressUpdate, 
    totalChallengesCompleted, currentStreak, longestStreak 
  } = useWeeklyChallenges(user?.id, playSound, fireChallengeBurst, { vibrateProgress, vibrateComplete, vibrateAchievement });
  const { state, message, messageType, kittensBreed, currentDailyEvent, relationshipSystem, actions } = useGameState(playSound, updateChallengeProgress, logActivity);
  const isMobile = useIsMobile();
  const { cloudSave, cloudLoad, hasCloudSave } = useCloudSave(user?.id);
  const { syncPlayerStats } = useGlobalLeaderboard(user?.id);
  const { profile } = usePlayerProfile(user?.id);
  const { theme, setTheme } = useTheme();
  const {
    currentStreak: loginStreak,
    longestStreak: loginLongestStreak,
    totalLogins,
    canClaim: canClaimDailyReward,
    showModal: showDailyRewardsModal,
    setShowModal: setShowDailyRewardsModal,
    claimDailyReward,
    vipTier,
    isVIP,
  } = useDailyLoginRewards(user?.id, playSound, vibrateAchievement, fireConfetti);
  const { newGiftAlert, clearNewGift, acceptGift: acceptCatGift, declineGift: declineCatGift } = useCatGifts(user?.id);
  const { newTradeAlert, clearNewTrade, acceptTrade: acceptTradeOffer, declineTrade: declineTradeOffer } = useTrading(user?.id);
  const { showOutdatedToast } = usePortraitOutdatedToast();
  const [sideTab, setSideTab] = useState('actions');
  const [soundOn, setSoundOn] = useState(true);
  const [musicOn, setMusicOn] = useState(false);
  const [currentMoodLabel, setCurrentMoodLabel] = useState('');
  const [sfxVolume, setSfxVolume] = useState(50);
  const [musicVolume, setMusicVolumeState] = useState(40);
  const [lastAchievementCount, setLastAchievementCount] = useState(0);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const [highlightedTab, setHighlightedTab] = useState<string | null>(null);
  const [cloudSyncing, setCloudSyncing] = useState(false);
  const [lastCloudSave, setLastCloudSave] = useState<string | null>(null);
  const [hasLoadedCloud, setHasLoadedCloud] = useState(false);
  const [showWhatsNew, setShowWhatsNew] = useState(false);

  // Play sound when receiving gift
  useEffect(() => {
    if (newGiftAlert) {
      playSound?.('giftReceived');
    }
  }, [newGiftAlert, playSound]);

  // Play sound when receiving trade
  useEffect(() => {
    if (newTradeAlert) {
      playSound?.('tradeReceived');
    }
  }, [newTradeAlert, playSound]);

  // Handle accepting gift from popup
  const handleAcceptGiftFromPopup = async (giftId: string) => {
    const cat = await acceptCatGift(giftId);
    if (cat) {
      actions.addReceivedCat?.(cat);
      playSound?.('success');
      fireConfetti();
    }
    clearNewGift();
  };

  const handleDeclineGiftFromPopup = async (giftId: string) => {
    await declineCatGift(giftId);
    clearNewGift();
  };

  // Handle accepting trade from popup
  const handleAcceptTradeFromPopup = async (tradeId: string) => {
    const trade = await acceptTradeOffer(tradeId);
    if (trade) {
      // Add received cats and resources
      if (trade.offered_cats) {
        for (const cat of trade.offered_cats) {
          actions.addReceivedCat?.(cat);
        }
      }
      if (trade.offered_money) {
        actions.addReward?.(trade.offered_money, {});
      }
      playSound?.('success');
      fireConfetti();
    }
    clearNewTrade();
  };

  const handleDeclineTradeFromPopup = async (tradeId: string) => {
    await declineTradeOffer(tradeId);
    clearNewTrade();
  };

  // Handle claiming daily reward
  const handleClaimDailyReward = async () => {
    const reward = await claimDailyReward();
    if (reward) {
      actions.addReward?.(reward.coins, reward.resources as Resources);
      // Unlock VIP costumes if any
      if (reward.unlockedCostumes) {
        for (const costumeId of reward.unlockedCostumes) {
          if (!state.ownedCostumes.includes(costumeId)) {
            actions.buyCostume?.(costumeId);
          }
        }
      }
    }
  };

  // Load cloud save on login
  useEffect(() => {
    if (user && !hasLoadedCloud) {
      cloudLoad().then(({ data }) => {
        if (data) {
          actions.loadFromData?.(data.game_state, data.kittens_bred, data.relationships);
          setLastCloudSave(data.last_played_at);
        }
        setHasLoadedCloud(true);
      });
    }
  }, [user, hasLoadedCloud, cloudLoad, actions]);

  // Auto-save to cloud every 5 minutes when logged in
  useEffect(() => {
    if (!user) return;
    
    const interval = setInterval(async () => {
      setCloudSyncing(true);
      const result = await cloudSave(state, kittensBreed, relationshipSystem.getRelationshipSaveData());
      if (result.success) {
        setLastCloudSave(new Date().toISOString());
      }
      setCloudSyncing(false);
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [user, state, kittensBreed, relationshipSystem, cloudSave]);

  const handleCloudSave = async () => {
    if (!user) return;
    setCloudSyncing(true);
    const result = await cloudSave(state, kittensBreed, relationshipSystem.getRelationshipSaveData());
    if (result.success) {
      setLastCloudSave(new Date().toISOString());
      // Sync player stats to global leaderboard
      await syncPlayerStats(state, kittensBreed, profile?.display_name || undefined, profile?.avatar_emoji || undefined);
      playSound?.('success');
    }
    setCloudSyncing(false);
  };

  const handleCloudLoad = async () => {
    if (!user) return;
    const { data } = await cloudLoad();
    if (data) {
      actions.loadFromData?.(data.game_state, data.kittens_bred, data.relationships);
      setLastCloudSave(data.last_played_at);
      playSound?.('success');
    }
  };

  // Keyboard shortcuts
  const handleFeed = useCallback(() => {
    if (state.resources.food > 0 && state.cats.length > 0) {
      actions.feedCats();
    }
  }, [state.resources.food, state.cats.length, actions]);

  useKeyboardShortcuts({
    onFeed: handleFeed,
    onNextDay: actions.nextDay,
    onSave: actions.saveGame,
    onTabChange: setSideTab,
  });

  // Listen for ? key to show shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === '?' && !(e.target instanceof HTMLInputElement)) {
        setShowShortcutsHelp(true);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  // Update music mood when day changes
  useEffect(() => {
    if (musicOn) {
      updateMusicForDay(state.day);
      setCurrentMoodLabel(MOOD_LABELS[getCurrentMood()]);
    }
  }, [state.day, musicOn, updateMusicForDay, getCurrentMood]);

  // Fire confetti on achievements
  useEffect(() => {
    const unlockedCount = state.achievements.filter(a => a.unlocked).length;
    if (unlockedCount > lastAchievementCount && lastAchievementCount > 0) {
      fireStars();
      if (musicOn) {
        triggerCelebration();
        setCurrentMoodLabel(MOOD_LABELS.celebration);
        setTimeout(() => setCurrentMoodLabel(MOOD_LABELS[getCurrentMood()]), 10000);
      }
    }
    setLastAchievementCount(unlockedCount);
  }, [state.achievements, lastAchievementCount, fireStars, musicOn, triggerCelebration, getCurrentMood]);

  // Fire confetti on show wins
  useEffect(() => {
    if (message?.includes('wins!') && message?.includes('Cat show')) {
      fireCelebration();
      if (musicOn) {
        triggerCelebration();
        setCurrentMoodLabel(MOOD_LABELS.celebration);
        setTimeout(() => setCurrentMoodLabel(MOOD_LABELS[getCurrentMood()]), 10000);
      }
    }
  }, [message, fireCelebration, musicOn, triggerCelebration, getCurrentMood]);

  // Trigger tense mood on negative events
  useEffect(() => {
    if (musicOn && (message?.includes('fight') || message?.includes('sick') || message?.includes('ran away') || message?.includes('passed away'))) {
      triggerTense();
      setCurrentMoodLabel(MOOD_LABELS.tense);
      setTimeout(() => setCurrentMoodLabel(MOOD_LABELS[getCurrentMood()]), 6000);
    }
  }, [message, musicOn, triggerTense, getCurrentMood]);

  // Check for What's New popup on mount (after tutorial)
  useEffect(() => {
    const lastSeenVersion = localStorage.getItem('cat-farm-last-seen-version');
    const tutorialComplete = localStorage.getItem('cat-farm-tutorial-complete');
    
    // Only show if tutorial is done and version is new
    if (tutorialComplete && lastSeenVersion !== CURRENT_VERSION) {
      // Delay so daily rewards appears first
      const timer = setTimeout(() => setShowWhatsNew(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const toggleSound = () => {
    const newState = !soundOn;
    setSoundOn(newState);
    setEnabled(newState);
    if (newState) playSound('click');
  };

  const toggleMusic = () => {
    if (musicOn) {
      stopMusic();
      setMusicOn(false);
      setCurrentMoodLabel('');
    } else {
      startMusic();
      setMusicOn(true);
      updateMusicForDay(state.day);
      setCurrentMoodLabel(MOOD_LABELS[getCurrentMood()]);
      playSound('click');
    }
  };

  const handleSfxVolumeChange = (value: number[]) => {
    const vol = value[0];
    setSfxVolume(vol);
    setVolume(vol / 100);
  };

  const handleMusicVolumeChange = (value: number[]) => {
    const vol = value[0];
    setMusicVolumeState(vol);
    setMusicVolume((vol / 100) * 0.3);
  };

  const { getCatReaction } = useCatReactions();

  // Show skeleton during initial cloud load
  if (authLoading || (user && !hasLoadedCloud)) {
    return (
      <AnimatedBackground variant="game" className="min-h-screen">
        <FloatingDecorations variant="paws" density="low" className="opacity-20" />
        <header className="game-header">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-4 w-48 hidden sm:block" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-10 rounded" />
            <Skeleton className="h-10 w-10 rounded" />
            <Skeleton className="h-10 w-20 rounded" />
          </div>
        </header>
        <StatusBarSkeleton />
        <div className="flex-1 flex flex-col">
          <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-2">
            <div className="flex w-full justify-center gap-1 p-1">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-10 rounded-md" />
              ))}
            </div>
          </div>
          <main className="game-main">
            <section className="cat-grid-section">
              <div className="flex items-center justify-between mb-4">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-4 w-20" />
              </div>
              <CatGridSkeleton count={6} />
            </section>
            <aside className="action-sidebar">
              <PanelSkeleton rows={4} />
            </aside>
          </main>
        </div>
      </AnimatedBackground>
    );
  }

  return (
    <AnimatedBackground variant="game" className="min-h-screen">
      <FloatingDecorations variant="paws" density="low" className="opacity-20" />
      <TutorialSystem onHighlightTab={setHighlightedTab} />
      <KeyboardShortcutsHelp open={showShortcutsHelp} onClose={() => setShowShortcutsHelp(false)} />
      <RelationshipAnimations events={relationshipSystem.events} lastEventId={relationshipSystem.lastEventId} />
      <MoodAnimations cats={state.cats} />
      <CatActivityPopups 
        cats={state.cats} 
        onCatClick={(catId) => {
          const cat = state.cats.find(c => c.id === catId);
          if (cat) playSound('click');
        }}
        onFeed={(catId) => actions.feedSingleCat?.(catId)}
        onComfort={(catId) => actions.comfortCat(catId)}
        onHeal={(catId) => actions.useMedicine(catId)}
        hasFood={state.resources.food > 0}
        hasMedicine={state.resources.medicine > 0}
      />
      <DailyEventToast event={currentDailyEvent} onDismiss={actions.clearDailyEvent} />
      
      {/* Gift Received Popup */}
      <GiftReceivedDialog
        gift={newGiftAlert}
        onAccept={handleAcceptGiftFromPopup}
        onDecline={handleDeclineGiftFromPopup}
        onClose={clearNewGift}
      />
      
      {/* Trade Received Popup */}
      <TradeReceivedDialog
        trade={newTradeAlert}
        onAccept={handleAcceptTradeFromPopup}
        onDecline={handleDeclineTradeFromPopup}
        onClose={clearNewTrade}
      />
      
      {/* Daily Login Rewards Modal */}
      <DailyRewardsPanel
        currentStreak={loginStreak}
        longestStreak={loginLongestStreak}
        totalLogins={totalLogins}
        canClaim={canClaimDailyReward}
        showModal={showDailyRewardsModal}
        onCloseModal={() => setShowDailyRewardsModal(false)}
        onClaim={handleClaimDailyReward}
        vipTier={vipTier}
        isVIP={isVIP}
      />
      
      {/* What's New Popup */}
      <WhatsNewPopup
        open={showWhatsNew}
        onClose={() => setShowWhatsNew(false)}
      />
      
      <header className="game-header">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl md:text-3xl font-bold text-gradient-primary">🐱 Cat Farm</h1>
          <span className="text-xs text-muted-foreground hidden sm:inline">Build your 100-acre cat empire!</span>
        </div>
        <div className="flex items-center gap-2">
          {musicOn && currentMoodLabel && (
            <span className="text-xs text-muted-foreground hidden sm:inline">{currentMoodLabel}</span>
          )}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" title="Audio settings">
                <Settings2 className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64" align="end">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Volume2 className="h-4 w-4" /> Sound Effects
                    </label>
                    <span className="text-xs text-muted-foreground">{sfxVolume}%</span>
                  </div>
                  <Slider
                    value={[sfxVolume]}
                    onValueChange={handleSfxVolumeChange}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Music className="h-4 w-4" /> Music
                    </label>
                    <span className="text-xs text-muted-foreground">{musicVolume}%</span>
                  </div>
                  <Slider
                    value={[musicVolume]}
                    onValueChange={handleMusicVolumeChange}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                </div>
                <div className="border-t pt-3">
                  <button
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    className="flex items-center gap-2 w-full text-sm font-medium hover:text-primary transition-colors"
                  >
                    {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                    {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                  </button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <Button variant="ghost" size="sm" onClick={toggleMusic} title={musicOn ? "Stop music" : "Play ambient music"}>
            {musicOn ? <Music2 className="h-4 w-4 text-primary" /> : <Music className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="sm" onClick={toggleSound} title={soundOn ? "Mute sounds" : "Unmute sounds"}>
            {soundOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </Button>
          <Link to="/collection">
            <Button variant="ghost" size="sm" title="Cat Collection (C)" className="min-h-10 min-w-10">
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </Link>
          <Link to="/leaderboard">
            <Button variant="ghost" size="sm" title="Global Leaderboard" className="min-h-10 min-w-10">
              <Globe className="h-4 w-4" />
            </Button>
          </Link>
          <Link to="/stats">
            <Button variant="ghost" size="sm" title="Your Stats" className="min-h-10 min-w-10">
              <BarChart3 className="h-4 w-4" />
            </Button>
          </Link>
          {!isMobile && (
            <Button variant="ghost" size="sm" onClick={() => setShowShortcutsHelp(true)} title="Keyboard Shortcuts (?)" className="min-h-10 min-w-10">
              <Keyboard className="h-4 w-4" />
            </Button>
          )}
          
          {/* What's New Button */}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowWhatsNew(true)} 
            title="What's New"
            className="min-h-10 min-w-10"
          >
            <Sparkles className="h-4 w-4" />
          </Button>
          
          {/* Notification Center */}
          <NotificationCenter userId={user?.id} onNavigate={setSideTab} />
          
          {/* VIP Badge */}
          {user && isVIP && vipTier && (
            <Badge 
              className="bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-bold text-xs animate-vip-glow cursor-pointer"
              onClick={() => setShowDailyRewardsModal(true)}
            >
              {vipTier.emoji} {vipTier.name}
            </Badge>
          )}
          
          {/* Daily Rewards Button */}
          {user && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowDailyRewardsModal(true)}
              title="Daily Rewards"
              className={`min-h-10 min-w-10 relative ${canClaimDailyReward ? 'animate-bounce-gentle' : ''}`}
            >
              <CalendarDays className="h-4 w-4" />
              {canClaimDailyReward && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-pulse" />
              )}
            </Button>
          )}
          
          {/* Cloud sync indicator */}
          {user && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleCloudSave} 
              disabled={cloudSyncing}
              title={cloudSyncing ? 'Syncing...' : 'Sync to cloud'}
              className="min-h-10 min-w-10"
            >
              {cloudSyncing ? (
                <Cloud className="h-4 w-4 animate-pulse text-primary" />
              ) : (
                <Cloud className="h-4 w-4 text-green-500" />
              )}
            </Button>
          )}
          
          {!user && (
            <Button variant="ghost" size="sm" onClick={actions.saveGame} title="Save (S)" className="min-h-10 min-w-10">💾</Button>
          )}
          
          {/* Auth buttons */}
          {user ? (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="min-h-10 gap-2">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline text-xs">{user.email?.split('@')[0]}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48" align="end">
                <div className="space-y-2">
                  <p className="text-sm font-medium truncate">{user.email}</p>
                  {lastCloudSave && (
                    <p className="text-xs text-muted-foreground">
                      Last sync: {new Date(lastCloudSave).toLocaleTimeString()}
                    </p>
                  )}
                  <Button variant="outline" size="sm" className="w-full" onClick={() => signOut()}>
                    <LogOut className="h-4 w-4 mr-2" /> Log Out
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          ) : (
            <Link to="/auth">
              <Button variant="outline" size="sm" className="min-h-10 gap-2">
                <LogIn className="h-4 w-4" />
                <span className="hidden sm:inline">Log In</span>
              </Button>
            </Link>
          )}
          
          <Button variant="ghost" size="sm" onClick={actions.resetGame} className="min-h-10 min-w-10">New Game</Button>
        </div>
      </header>

      <StatusBar state={state} onUpgrade={actions.upgradeHouse} onCatShow={actions.catShow} relationships={relationshipSystem.relationships} />
      <MessageBar message={message} type={messageType} onDismiss={actions.dismissMessage} />

      <Tabs value={sideTab} onValueChange={setSideTab} className="flex-1 flex flex-col">
        {/* Tab navigation - sticky at top */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-2">
          <TooltipProvider delayDuration={300}>
            <TabsList className="flex w-full justify-center overflow-x-auto scrollbar-hide gap-1 p-1">
              <Tooltip><TooltipTrigger asChild><TabsTrigger value="actions" className={`flex-shrink-0 min-w-10 min-h-10 text-base ${highlightedTab === 'actions' ? 'ring-2 ring-primary animate-pulse' : ''}`}>🐾</TabsTrigger></TooltipTrigger><TooltipContent>Actions</TooltipContent></Tooltip>
              <Tooltip><TooltipTrigger asChild><TabsTrigger value="chores" className={`flex-shrink-0 min-w-10 min-h-10 text-base ${highlightedTab === 'chores' ? 'ring-2 ring-primary animate-pulse' : ''}`}>🧹</TabsTrigger></TooltipTrigger><TooltipContent>Chores</TooltipContent></Tooltip>
              <Tooltip><TooltipTrigger asChild><TabsTrigger value="supplies" className={`flex-shrink-0 min-w-10 min-h-10 text-base ${highlightedTab === 'supplies' ? 'ring-2 ring-primary animate-pulse' : ''}`}>📦</TabsTrigger></TooltipTrigger><TooltipContent>Supplies</TooltipContent></Tooltip>
              <Tooltip><TooltipTrigger asChild><TabsTrigger value="market" className={`flex-shrink-0 min-w-10 min-h-10 text-base ${highlightedTab === 'market' ? 'ring-2 ring-primary animate-pulse' : ''}`}>🛒</TabsTrigger></TooltipTrigger><TooltipContent>Market</TooltipContent></Tooltip>
              <Tooltip><TooltipTrigger asChild><TabsTrigger value="costumes" className={`flex-shrink-0 min-w-10 min-h-10 text-base ${highlightedTab === 'costumes' ? 'ring-2 ring-primary animate-pulse' : ''}`}>👗</TabsTrigger></TooltipTrigger><TooltipContent>Costumes</TooltipContent></Tooltip>
              <Tooltip><TooltipTrigger asChild><TabsTrigger value="breeding" className={`flex-shrink-0 min-w-10 min-h-10 text-base ${highlightedTab === 'breeding' ? 'ring-2 ring-primary animate-pulse' : ''}`}>💕</TabsTrigger></TooltipTrigger><TooltipContent>Breeding</TooltipContent></Tooltip>
              <Tooltip><TooltipTrigger asChild><TabsTrigger value="training" className={`flex-shrink-0 min-w-10 min-h-10 text-base ${highlightedTab === 'training' ? 'ring-2 ring-primary animate-pulse' : ''}`}>💪</TabsTrigger></TooltipTrigger><TooltipContent>Training</TooltipContent></Tooltip>
              <Tooltip><TooltipTrigger asChild><TabsTrigger value="bulk" className={`flex-shrink-0 min-w-10 min-h-10 text-base ${highlightedTab === 'bulk' ? 'ring-2 ring-primary animate-pulse' : ''}`}>⚡</TabsTrigger></TooltipTrigger><TooltipContent>Bulk Actions</TooltipContent></Tooltip>
              <Tooltip><TooltipTrigger asChild><TabsTrigger value="social" className={`flex-shrink-0 min-w-10 min-h-10 text-base ${highlightedTab === 'social' ? 'ring-2 ring-primary animate-pulse' : ''}`}>🤝</TabsTrigger></TooltipTrigger><TooltipContent>Social</TooltipContent></Tooltip>
              <Tooltip><TooltipTrigger asChild><TabsTrigger value="leaderboard" className={`flex-shrink-0 min-w-10 min-h-10 text-base ${highlightedTab === 'leaderboard' ? 'ring-2 ring-primary animate-pulse' : ''}`}>🏆</TabsTrigger></TooltipTrigger><TooltipContent>Leaderboard</TooltipContent></Tooltip>
              <Tooltip><TooltipTrigger asChild><TabsTrigger value="friends" className={`flex-shrink-0 min-w-10 min-h-10 text-base ${highlightedTab === 'friends' ? 'ring-2 ring-primary animate-pulse' : ''}`}><Users className="h-4 w-4" /></TabsTrigger></TooltipTrigger><TooltipContent>Friends</TooltipContent></Tooltip>
              <Tooltip><TooltipTrigger asChild><TabsTrigger value="profile" className={`flex-shrink-0 min-w-10 min-h-10 text-base ${highlightedTab === 'profile' ? 'ring-2 ring-primary animate-pulse' : ''}`}><User className="h-4 w-4" /></TabsTrigger></TooltipTrigger><TooltipContent>Profile</TooltipContent></Tooltip>
              <Tooltip><TooltipTrigger asChild><TabsTrigger value="gifts" className={`flex-shrink-0 min-w-10 min-h-10 text-base ${highlightedTab === 'gifts' ? 'ring-2 ring-primary animate-pulse' : ''}`}><Gift className="h-4 w-4" /></TabsTrigger></TooltipTrigger><TooltipContent>Gifts</TooltipContent></Tooltip>
              <Tooltip><TooltipTrigger asChild><TabsTrigger value="trading" className={`flex-shrink-0 min-w-10 min-h-10 text-base ${highlightedTab === 'trading' ? 'ring-2 ring-primary animate-pulse' : ''}`}><ArrowLeftRight className="h-4 w-4" /></TabsTrigger></TooltipTrigger><TooltipContent>Trading</TooltipContent></Tooltip>
              <Tooltip><TooltipTrigger asChild><TabsTrigger value="challenges" className={`flex-shrink-0 min-w-10 min-h-10 text-base ${highlightedTab === 'challenges' ? 'ring-2 ring-primary animate-pulse' : ''}`}><Target className="h-4 w-4" /></TabsTrigger></TooltipTrigger><TooltipContent>Challenges</TooltipContent></Tooltip>
              <Tooltip><TooltipTrigger asChild><TabsTrigger value="more" className={`flex-shrink-0 min-w-10 min-h-10 text-base ${highlightedTab === 'more' ? 'ring-2 ring-primary animate-pulse' : ''}`}>⚙️</TabsTrigger></TooltipTrigger><TooltipContent>Settings</TooltipContent></Tooltip>
            </TabsList>
          </TooltipProvider>
        </div>

        <main className="game-main">
          <section className="cat-grid-section">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-foreground">Your Cats</h2>
              <span className="text-sm text-muted-foreground">{state.cats.length} / {state.space} capacity</span>
            </div>
            
            {state.cats.length === 0 ? (
              <div className="empty-state">
                <span className="text-6xl mb-4">🐾</span>
                <p className="text-muted-foreground mb-2">No cats yet!</p>
                <p className="text-sm text-muted-foreground">Add a stray for free or buy from the market.</p>
              </div>
            ) : (
              <div className="cat-grid">
                {state.cats.map(cat => (
                        <CatCard 
                          key={cat.id} 
                          cat={cat} 
                          equippedCostumeId={state.catCostumes[cat.id]}
                          onSell={actions.sellCat} 
                          onHeal={actions.useMedicine}
                          onComfort={actions.comfortCat}
                          onRename={actions.renameCat}
                          relationships={relationshipSystem.relationships} 
                          allCats={state.cats}
                          reaction={getCatReaction(cat.id)}
                        />
                ))}
              </div>
            )}
          </section>

          <aside className="action-sidebar">
            <TabsContent value="actions" className="mt-0">
              <ActionPanel onAddCat={actions.addCat} onNextDay={actions.nextDay} money={state.money} space={state.space} catCount={state.cats.length} />
            </TabsContent>
            <TabsContent value="chores" className="mt-0"><ChorePanel onDoChore={actions.doChore} /></TabsContent>
            <TabsContent value="supplies" className="mt-0">
              <ResourcePanel resources={state.resources} money={state.money} catCount={state.cats.length}
                onBuyResource={actions.buyResource} onFeedCats={actions.feedCats} onUseToys={actions.useToys} />
            </TabsContent>
            <TabsContent value="market" className="mt-0">
              <MarketPanel listings={state.marketListings} money={state.money} hasSpace={state.cats.length < state.space} onBuy={actions.buyFromMarket} />
            </TabsContent>
            <TabsContent value="costumes" className="mt-0">
              <CostumeShopPanel 
                cats={state.cats} 
                money={state.money} 
                ownedCostumes={state.ownedCostumes} 
                catCostumes={state.catCostumes}
                onBuyCostume={actions.buyCostume}
                onEquipCostume={actions.equipCostume}
                onPortraitOutdated={showOutdatedToast}
              />
            </TabsContent>
            <TabsContent value="breeding" className="mt-0">
              <BreedingPanel cats={state.cats} cooldown={state.breedingCooldown} hasSpace={state.cats.length < state.space}
                onBreed={actions.breedCats} getBreedingCompatibility={relationshipSystem.getBreedingCompatibility} catCostumes={state.catCostumes} />
            </TabsContent>
            <TabsContent value="training" className="mt-0">
              <TrainingPanel cats={state.cats} treats={state.resources.treats} toys={state.resources.toys}
                day={state.day} onTrain={actions.trainCat} onRest={actions.restCat} catCostumes={state.catCostumes} />
            </TabsContent>
            <TabsContent value="bulk" className="mt-0">
              <BulkActionsPanel 
                cats={state.cats}
                resources={state.resources}
                day={state.day}
                relationships={relationshipSystem.relationships}
                onHealAll={actions.healAllSickCats}
                onRestAll={actions.restAllTiredCats}
                onComfortAll={actions.comfortAllUnhappyCats}
                onTrainAll={actions.trainAllAvailableCats}
                onSellSelected={actions.sellSelectedCats}
                catCostumes={state.catCostumes}
              />
            </TabsContent>
            <TabsContent value="social" className="mt-0 space-y-4">
              <SocializePanel cats={state.cats} treats={state.resources.treats}
                getRelationship={relationshipSystem.getRelationship} onSocialize={actions.socializeCats} catCostumes={state.catCostumes} />
              <MatchmakingPanel cats={state.cats} relationships={relationshipSystem.relationships}
                onSocialize={actions.socializeCats} treats={state.resources.treats} catCostumes={state.catCostumes} />
              <GroupActivitiesPanel cats={state.cats} groups={relationshipSystem.groups}
                treats={state.resources.treats} toys={state.resources.toys} onGroupActivity={actions.doGroupActivity} catCostumes={state.catCostumes} />
              <RelationshipPanel cats={state.cats} relationships={relationshipSystem.relationships}
                groups={relationshipSystem.groups} events={relationshipSystem.events} catCostumes={state.catCostumes} />
            </TabsContent>
            <TabsContent value="leaderboard" className="mt-0">
              <LeaderboardPanel cats={state.cats} relationships={relationshipSystem.relationships} catCostumes={state.catCostumes} />
            </TabsContent>
            <TabsContent value="friends" className="mt-0">
              <FriendsPanel userId={user?.id} />
            </TabsContent>
            <TabsContent value="profile" className="mt-0">
              <PlayerProfilePanel userId={user?.id} />
            </TabsContent>
            <TabsContent value="gifts" className="mt-0">
              <CatGiftingPanel 
                userId={user?.id} 
                cats={state.cats}
                onGiftSent={(catId) => actions.sellCat(catId)}
                onGiftReceived={(cat) => actions.addReceivedCat?.(cat)}
                catCostumes={state.catCostumes}
              />
            </TabsContent>
            <TabsContent value="trading" className="mt-0">
              <TradingPanel 
                userId={user?.id}
                cats={state.cats}
                money={state.money}
                resources={state.resources}
                onTradeComplete={(removeCats, addCats, moneyChange, resourceChanges) => {
                  removeCats.forEach(catId => actions.sellCat(catId));
                  addCats.forEach(cat => actions.addReceivedCat?.(cat));
                  // Money and resources handled by trade system
                }}
                catCostumes={state.catCostumes}
              />
            </TabsContent>
            <TabsContent value="challenges" className="mt-0">
              <WeeklyChallengesPanel
                challenges={challenges}
                loading={challengesLoading}
                timeRemaining={getTimeRemaining()}
                onClaimReward={claimReward}
                onRewardClaimed={(coins, badge) => {
                  playSound?.('coin');
                  fireConfetti();
                }}
                lastProgressUpdate={lastProgressUpdate}
                onProgressAnimationComplete={clearProgressUpdate}
                totalChallengesCompleted={totalChallengesCompleted}
                currentStreak={currentStreak}
                longestStreak={longestStreak}
              />
            </TabsContent>
            <TabsContent value="more" className="mt-0 space-y-4">
              <AchievementsPanel achievements={state.achievements}
                currentStats={{ cats: state.cats.length, showWins: state.totalShowWins, money: state.totalMoneyEarned,
                  breeding: kittensBreed, house: state.houseSize !== 'apartment', farm: state.houseSize === 'farm', acres: state.acres, challengesCompleted: totalChallengesCompleted }} />
              <GraphicsSettingsPanel />
              <SaveLoadPanel 
                onSave={user ? handleCloudSave : actions.saveGame} 
                onLoad={user ? handleCloudLoad : actions.loadGame} 
                hasSave={actions.hasSaveGame()} 
                lastSaveDay={actions.getSaveDay()}
                isLoggedIn={!!user}
                cloudSyncing={cloudSyncing}
                lastCloudSave={lastCloudSave}
              />
            </TabsContent>
          </aside>
        </main>
      </Tabs>
    </AnimatedBackground>
  );
}
