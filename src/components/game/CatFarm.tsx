import { useCatFarmState, TAB_LABELS } from '@/hooks/useCatFarmState';
import { useCatFarmHandlers, MOOD_LABELS } from '@/hooks/useCatFarmHandlers';

// Decomposed components
import { CatFarmSkeleton } from './CatFarmSkeleton';
import { CatFarmHeader } from './CatFarmHeader';
import { CatFarmDialogs } from './CatFarmDialogs';
import { CatFarmOverlays } from './CatFarmOverlays';

// Panel and UI components
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
import { UnifiedCatCard } from './UnifiedCatCard';
import { LeaderboardPanel } from './LeaderboardPanel';
import { DailyObjectivesPanel } from './DailyObjectivesPanel';
import { CollectionProgressPanel } from './CollectionProgressPanel';
import { LuckyWheelPanel } from './LuckyWheelPanel';
import { HallOfFamePanel } from './HallOfFamePanel';
import { SpecializationPanel } from './SpecializationPanel';
import { BattlePassPanel } from './BattlePassPanel';
import { CoopChallengesPanel } from './CoopChallengesPanel';
import { BulkActionsPanel } from './BulkActionsPanel';
import { FriendsPanel } from './FriendsPanel';
import { PlayerProfilePanel } from './PlayerProfilePanel';
import { CostumeShopPanel } from './CostumeShopPanel';
import { CatGiftingPanel } from './CatGiftingPanel';
import { TradingPanel } from './TradingPanel';
import { WeeklyChallengesPanel } from './WeeklyChallengesPanel';
import { GraphicsSettingsPanel } from './GraphicsSettingsPanel';
import { CategoryTabBar, getCategoryForTab } from './CategoryTabBar';
import { MobileBottomNav } from './MobileBottomNav';
import { MobileMenuSheet } from './MobileMenuSheet';
import { PanelErrorBoundary } from './PanelErrorBoundary';

// UI primitives
import { AnimatedBackground } from '@/components/ui/AnimatedBackground';
import { FloatingDecorations } from '@/components/ui/FloatingDecorations';
import { Tabs, TabsContent } from '@/components/ui/tabs';

// Types
import { Resources } from '@/types/game';

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
 * - Manages 22-tab sidebar layout for different game features
 */
export function CatFarm() {
  // Consolidated state and handlers
  const farmState = useCatFarmState();
  const handlers = useCatFarmHandlers({ farmState });
  
  // Destructure for convenience
  const {
    auth,
    isMobile,
    getCatReaction,
    state,
    actions,
    kittensBreed,
    currentDailyEvent,
    relationshipSystem,
    messageSystem,
    showOutdatedToast,
    relationshipReminders,
    weeklyChallenges,
    dailyRewards,
    gifts,
    trading,
    milestones,
    objectives,
    collection,
    luckyWheel,
    legacy,
    specializations,
    battlePass,
    friends,
    coopChallenges,
    badgeCounts,
    ui,
    theme,
  } = farmState;

  const {
    handleAcceptGiftFromPopup,
    handleDeclineGiftFromPopup,
    handleAcceptTradeFromPopup,
    handleDeclineTradeFromPopup,
    handleClaimDailyReward,
    handleClaimMilestone,
    handleClaimObjectivesBonus,
    handleClaimWheelPrize,
    handleClaimBPReward,
    handleUpgradePremium,
    handleClaimCoopReward,
    handleRetireCat,
    dispatchAction,
    trackObjective,
    handleQuickSocialize,
    clearQuickSocializePair,
    handleCloudSave,
    handleCloudLoad,
    toggleSound,
    toggleMusic,
    handleSfxVolumeChange,
    handleMusicVolumeChange,
  } = handlers;

  // Show skeleton during initial cloud load
  if (auth.loading || (auth.user && !ui.hasLoadedCloud)) {
    return <CatFarmSkeleton />;
  }

  return (
    <AnimatedBackground variant="game" className="min-h-screen">
      <FloatingDecorations variant="paws" density="low" className="opacity-20" />
      
      {/* Overlays: Tutorial, Animations, Popups */}
      <CatFarmOverlays
        onHighlightTab={ui.setHighlightedTab}
        showShortcutsHelp={ui.showShortcutsHelp}
        onCloseShortcutsHelp={() => ui.setShowShortcutsHelp(false)}
        events={relationshipSystem.events}
        lastEventId={relationshipSystem.lastEventId}
        cats={state.cats}
        onCatClick={() => farmState.sound.playSound('click')}
        onFeed={(catId) => { actions.feedSingleCat?.(catId); trackObjective('feed_cats'); }}
        onComfort={(catId) => dispatchAction('COMFORT_CAT', { catId })}
        onHeal={(catId) => dispatchAction('USE_MEDICINE', { catId })}
        hasFood={state.resources.food > 0}
        hasMedicine={state.resources.medicine > 0}
        currentDailyEvent={currentDailyEvent}
        onDismissDailyEvent={actions.clearDailyEvent}
      />
      
      {/* Dialogs: Milestones, Gifts, Trades, Daily Rewards, What's New */}
      <CatFarmDialogs
        newGiftAlert={gifts.newGiftAlert}
        onAcceptGift={handleAcceptGiftFromPopup}
        onDeclineGift={handleDeclineGiftFromPopup}
        onClearGift={gifts.clearNewGift}
        newTradeAlert={trading.newTradeAlert}
        onAcceptTrade={handleAcceptTradeFromPopup}
        onDeclineTrade={handleDeclineTradeFromPopup}
        onClearTrade={trading.clearNewTrade}
        pendingMilestone={milestones.pendingCelebration}
        onClaimMilestone={handleClaimMilestone}
        onDismissMilestone={milestones.dismissCelebration}
        loginStreak={dailyRewards.currentStreak}
        loginLongestStreak={dailyRewards.longestStreak}
        totalLogins={dailyRewards.totalLogins}
        canClaimDailyReward={dailyRewards.canClaim}
        showDailyRewardsModal={dailyRewards.showModal}
        onCloseDailyRewardsModal={() => dailyRewards.setShowModal(false)}
        onClaimDailyReward={handleClaimDailyReward}
        vipTier={dailyRewards.vipTier}
        isVIP={dailyRewards.isVIP}
        showWhatsNew={ui.showWhatsNew}
        onCloseWhatsNew={() => ui.setShowWhatsNew(false)}
      />
      
      {/* Header: Logo, Audio, User Menu */}
      <CatFarmHeader
        musicOn={ui.musicOn}
        soundOn={ui.soundOn}
        currentMoodLabel={ui.currentMoodLabel}
        sfxVolume={ui.sfxVolume}
        musicVolume={ui.musicVolume}
        onToggleMusic={toggleMusic}
        onToggleSound={toggleSound}
        onSfxVolumeChange={handleSfxVolumeChange}
        onMusicVolumeChange={handleMusicVolumeChange}
        theme={theme.theme}
        onThemeChange={() => theme.setTheme(theme.theme === 'dark' ? 'light' : 'dark')}
        recentTabs={ui.recentTabs}
        onNavigateTab={ui.setSideTab}
        onShowShortcutsHelp={() => ui.setShowShortcutsHelp(true)}
        onShowWhatsNew={() => ui.setShowWhatsNew(true)}
        onShowDailyRewards={() => dailyRewards.setShowModal(true)}
        user={auth.user}
        onSignOut={auth.signOut}
        lastCloudSave={ui.lastCloudSave}
        cloudSyncing={ui.cloudSyncing}
        onCloudSave={handleCloudSave}
        onLocalSave={actions.saveGame}
        onResetGame={actions.resetGame}
        isVIP={dailyRewards.isVIP}
        vipTier={dailyRewards.vipTier}
        canClaimDailyReward={dailyRewards.canClaim}
        isMobile={isMobile}
      />

      <StatusBar 
        day={state.day}
        money={state.money}
        cats={state.cats}
        space={state.space}
        houseSize={state.houseSize}
        acres={state.acres}
        totalShowWins={state.totalShowWins}
        showCooldown={state.showCooldown}
        onUpgrade={actions.upgradeHouse} 
        onCatShow={(tier) => dispatchAction('CAT_SHOW', { tier })} 
        relationships={relationshipSystem.relationships} 
      />
      <MessageBar gameMessage={messageSystem.currentMessage} onDismiss={messageSystem.dismissMessage} queueCount={messageSystem.queueCount} />

      <Tabs value={ui.sideTab} onValueChange={ui.setSideTab} className={`flex-1 flex flex-col ${isMobile ? 'pb-16' : ''}`}>
        {/* Category-based Tab navigation */}
        <div className={`sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border ${isMobile ? 'px-2' : 'px-4'} py-2`}>
          <CategoryTabBar 
            activeTab={ui.sideTab}
            onTabChange={ui.setSideTab}
            highlightedTab={ui.highlightedTab}
            badges={badgeCounts.tabBadges}
          />
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
                  <UnifiedCatCard 
                    key={cat.id} 
                    cat={cat}
                    variant="card"
                    equippedCostumeId={state.catCostumes[cat.id]}
                    onSell={(catId) => dispatchAction('SELL_CAT', { catId })} 
                    onHeal={(catId) => dispatchAction('USE_MEDICINE', { catId })}
                    onComfort={(catId) => dispatchAction('COMFORT_CAT', { catId })}
                    onRename={actions.renameCat}
                    relationships={relationshipSystem.relationships} 
                    allCats={state.cats}
                    reaction={getCatReaction(cat.id)}
                    showStats
                    showRelationships
                    showActions
                  />
                ))}
              </div>
            )}
          </section>

          <aside className="action-sidebar">
            <TabsContent value="actions" className="mt-0">
              <PanelErrorBoundary panelName="ActionPanel">
                <ActionPanel onAddCat={actions.addCat} onNextDay={actions.nextDay} money={state.money} space={state.space} catCount={state.cats.length} />
              </PanelErrorBoundary>
            </TabsContent>
            <TabsContent value="chores" className="mt-0">
              <PanelErrorBoundary panelName="ChorePanel">
                <ChorePanel onDoChore={(choreId, baseReward) => dispatchAction('DO_CHORE', { choreId, baseReward })} />
              </PanelErrorBoundary>
            </TabsContent>
            <TabsContent value="supplies" className="mt-0">
              <PanelErrorBoundary panelName="ResourcePanel">
                <ResourcePanel resources={state.resources} money={state.money} catCount={state.cats.length}
                  onBuyResource={(resource, cost) => dispatchAction('BUY_RESOURCE', { resource: resource as keyof Resources, cost })} onFeedCats={() => dispatchAction('FEED_CATS')} onUseToys={actions.useToys} />
              </PanelErrorBoundary>
            </TabsContent>
            <TabsContent value="market" className="mt-0">
              <PanelErrorBoundary panelName="MarketPanel">
                <MarketPanel listings={state.marketListings} money={state.money} hasSpace={state.cats.length < state.space} onBuy={actions.buyFromMarket} />
              </PanelErrorBoundary>
            </TabsContent>
            <TabsContent value="costumes" className="mt-0">
              <PanelErrorBoundary panelName="CostumeShopPanel">
                <CostumeShopPanel 
                  cats={state.cats} 
                  money={state.money} 
                  ownedCostumes={state.ownedCostumes} 
                  catCostumes={state.catCostumes}
                  onBuyCostume={actions.buyCostume}
                  onEquipCostume={actions.equipCostume}
                  onPortraitOutdated={showOutdatedToast}
                />
              </PanelErrorBoundary>
            </TabsContent>
            <TabsContent value="breeding" className="mt-0">
              <PanelErrorBoundary panelName="BreedingPanel">
                <BreedingPanel cats={state.cats} cooldown={state.breedingCooldown} hasSpace={state.cats.length < state.space}
                  onBreed={(cat1Id, cat2Id) => dispatchAction('BREED_CATS', { cat1Id, cat2Id })} getBreedingCompatibility={relationshipSystem.getBreedingCompatibility} catCostumes={state.catCostumes} relationships={relationshipSystem.relationships} />
              </PanelErrorBoundary>
            </TabsContent>
            <TabsContent value="training" className="mt-0">
              <PanelErrorBoundary panelName="TrainingPanel">
                <TrainingPanel cats={state.cats} treats={state.resources.treats} toys={state.resources.toys}
                  day={state.day} onTrain={(catId, trickId) => dispatchAction('TRAIN_CAT', { catId, trickId })} onRest={actions.restCat} catCostumes={state.catCostumes} />
              </PanelErrorBoundary>
            </TabsContent>
            <TabsContent value="bulk" className="mt-0">
              <PanelErrorBoundary panelName="BulkActionsPanel">
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
                  onSocializeAll={actions.socializeAllNeglected}
                  catCostumes={state.catCostumes}
                />
              </PanelErrorBoundary>
            </TabsContent>
            <TabsContent value="social" className="mt-0 space-y-4">
              <PanelErrorBoundary panelName="SocialPanels">
                <SocializePanel cats={state.cats} treats={state.resources.treats}
                  getRelationship={relationshipSystem.getRelationship} onSocialize={(cat1Id, cat2Id) => dispatchAction('SOCIALIZE_CATS', { cat1Id, cat2Id })} catCostumes={state.catCostumes}
                  initialCat1Id={ui.quickSocializePair?.cat1Id} initialCat2Id={ui.quickSocializePair?.cat2Id} onClearSelection={clearQuickSocializePair} />
                <MatchmakingPanel cats={state.cats} relationships={relationshipSystem.relationships}
                  onSocialize={(cat1Id, cat2Id) => dispatchAction('SOCIALIZE_CATS', { cat1Id, cat2Id })} treats={state.resources.treats} catCostumes={state.catCostumes} />
                <GroupActivitiesPanel cats={state.cats} groups={relationshipSystem.groups}
                  treats={state.resources.treats} toys={state.resources.toys} onGroupActivity={actions.doGroupActivity} catCostumes={state.catCostumes} />
                <RelationshipPanel cats={state.cats} relationships={relationshipSystem.relationships}
                  groups={relationshipSystem.groups} events={relationshipSystem.events} catCostumes={state.catCostumes}
                  currentDay={state.day} maintenanceStreak={relationshipSystem.maintenanceStreak} 
                  needsAttentionCount={relationshipReminders.needsAttentionCount} onQuickSocialize={handleQuickSocialize} />
              </PanelErrorBoundary>
            </TabsContent>
            <TabsContent value="leaderboard" className="mt-0">
              <PanelErrorBoundary panelName="LeaderboardPanel">
                <LeaderboardPanel cats={state.cats} relationships={relationshipSystem.relationships} catCostumes={state.catCostumes} />
              </PanelErrorBoundary>
            </TabsContent>
            <TabsContent value="friends" className="mt-0">
              <PanelErrorBoundary panelName="FriendsPanel">
                <FriendsPanel userId={auth.user?.id} />
              </PanelErrorBoundary>
            </TabsContent>
            <TabsContent value="profile" className="mt-0">
              <PanelErrorBoundary panelName="PlayerProfilePanel">
                <PlayerProfilePanel userId={auth.user?.id} />
              </PanelErrorBoundary>
            </TabsContent>
            <TabsContent value="gifts" className="mt-0">
              <PanelErrorBoundary panelName="CatGiftingPanel">
                <CatGiftingPanel 
                  userId={auth.user?.id} 
                  cats={state.cats}
                  onGiftSent={(catId) => actions.sellCat(catId)}
                  onGiftReceived={(cat) => actions.addReceivedCat?.(cat)}
                  catCostumes={state.catCostumes}
                />
              </PanelErrorBoundary>
            </TabsContent>
            <TabsContent value="trading" className="mt-0">
              <PanelErrorBoundary panelName="TradingPanel">
                <TradingPanel 
                  userId={auth.user?.id}
                  cats={state.cats}
                  money={state.money}
                  resources={state.resources}
                  onTradeComplete={(removeCats, addCats, moneyChange, resourceChanges) => {
                    removeCats.forEach(catId => actions.sellCat(catId));
                    addCats.forEach(cat => actions.addReceivedCat?.(cat));
                  }}
                  catCostumes={state.catCostumes}
                />
              </PanelErrorBoundary>
            </TabsContent>
            <TabsContent value="challenges" className="mt-0">
              <PanelErrorBoundary panelName="WeeklyChallengesPanel">
                <WeeklyChallengesPanel
                  challenges={weeklyChallenges.challenges}
                  loading={weeklyChallenges.loading}
                  timeRemaining={weeklyChallenges.getTimeRemaining()}
                  onClaimReward={weeklyChallenges.claimReward}
                  onRewardClaimed={(coins, badge) => {
                    farmState.sound.playSound?.('coin');
                    farmState.confetti.fireConfetti();
                  }}
                  lastProgressUpdate={weeklyChallenges.lastProgressUpdate}
                  onProgressAnimationComplete={weeklyChallenges.clearProgressUpdate}
                  totalChallengesCompleted={weeklyChallenges.totalChallengesCompleted}
                  currentStreak={weeklyChallenges.currentStreak}
                  longestStreak={weeklyChallenges.longestStreak}
                />
              </PanelErrorBoundary>
            </TabsContent>
            <TabsContent value="objectives" className="mt-0">
              <PanelErrorBoundary panelName="DailyObjectivesPanel">
                <DailyObjectivesPanel
                  objectives={objectives.objectives}
                  allCompleted={objectives.allCompleted}
                  bonusClaimed={objectives.bonusClaimed}
                  onClaimBonus={handleClaimObjectivesBonus}
                />
              </PanelErrorBoundary>
            </TabsContent>
            <TabsContent value="wheel" className="mt-0">
              <PanelErrorBoundary panelName="LuckyWheelPanel">
                <LuckyWheelPanel
                  canSpin={luckyWheel.canSpin}
                  spinsRemaining={luckyWheel.spinsRemaining}
                  isSpinning={luckyWheel.isSpinning}
                  lastPrize={luckyWheel.lastPrize}
                  totalSpins={luckyWheel.totalSpins}
                  isVIP={dailyRewards.isVIP}
                  onSpin={luckyWheel.spin}
                  onClaimPrize={handleClaimWheelPrize}
                  onClearPrize={luckyWheel.clearLastPrize}
                />
              </PanelErrorBoundary>
            </TabsContent>
            <TabsContent value="collection" className="mt-0">
              <PanelErrorBoundary panelName="CollectionProgressPanel">
                <CollectionProgressPanel
                  breedProgress={collection.breedProgress}
                  personalityProgress={collection.personalityProgress}
                  costumeProgress={collection.costumeProgress}
                  trickProgress={collection.trickProgress}
                  overallProgress={collection.overallProgress}
                  completedSets={collection.progress.completedSets}
                  getSetReward={collection.getSetReward}
                />
              </PanelErrorBoundary>
            </TabsContent>
            <TabsContent value="legacy" className="mt-0">
              <PanelErrorBoundary panelName="HallOfFamePanel">
                <HallOfFamePanel
                  cats={state.cats}
                  retiredCats={legacy.retiredCats}
                  totalLegacyBonus={legacy.totalLegacyBonus}
                  catCostumes={state.catCostumes}
                  onRetireCat={handleRetireCat}
                  canRetire={legacy.canRetire}
                  getEligibility={legacy.getEligibility}
                  getKittenBonuses={legacy.getKittenBonuses}
                />
              </PanelErrorBoundary>
            </TabsContent>
            <TabsContent value="specializations" className="mt-0">
              <PanelErrorBoundary panelName="SpecializationPanel">
                <SpecializationPanel
                  cats={state.cats}
                  catCostumes={state.catCostumes}
                  relationships={relationshipSystem.relationships}
                  kittensBred={kittensBreed}
                  onSpecialize={actions.setSpecialization}
                  canSpecialize={specializations.canSpecialize}
                  getSpecialization={specializations.getSpecialization}
                  getActiveBonuses={() => specializations.getActiveBonuses(state.cats)}
                />
              </PanelErrorBoundary>
            </TabsContent>
            <TabsContent value="battlepass" className="mt-0">
              <PanelErrorBoundary panelName="BattlePassPanel">
                <BattlePassPanel
                  money={state.money}
                  onClaimReward={handleClaimBPReward}
                  onUpgradePremium={handleUpgradePremium}
                />
              </PanelErrorBoundary>
            </TabsContent>
            <TabsContent value="coop" className="mt-0">
              <PanelErrorBoundary panelName="CoopChallengesPanel">
                <CoopChallengesPanel
                  userId={auth.user?.id}
                  friends={friends.friends}
                  activeChallenges={coopChallenges.activeChallenges}
                  pendingInvites={coopChallenges.pendingInvites}
                  sentInvites={coopChallenges.sentInvites}
                  templates={coopChallenges.templates}
                  onSendInvite={coopChallenges.sendInvite}
                  onAcceptInvite={coopChallenges.acceptInvite}
                  onDeclineInvite={coopChallenges.declineInvite}
                  onCancelInvite={coopChallenges.cancelInvite}
                  onClaimReward={handleClaimCoopReward}
                />
              </PanelErrorBoundary>
            </TabsContent>
            <TabsContent value="more" className="mt-0 space-y-4">
              <PanelErrorBoundary panelName="MorePanels">
                <AchievementsPanel achievements={state.achievements}
                  currentStats={{ cats: state.cats.length, showWins: state.totalShowWins, money: state.totalMoneyEarned,
                    breeding: kittensBreed, house: state.houseSize !== 'apartment', farm: state.houseSize === 'farm', acres: state.acres, challengesCompleted: weeklyChallenges.totalChallengesCompleted }} />
                <GraphicsSettingsPanel />
                <SaveLoadPanel 
                  onSave={auth.user ? handleCloudSave : actions.saveGame} 
                  onLoad={auth.user ? handleCloudLoad : actions.loadGame} 
                  hasSave={actions.hasSaveGame()} 
                  lastSaveDay={actions.getSaveDay()}
                  isLoggedIn={!!auth.user}
                  cloudSyncing={ui.cloudSyncing}
                  lastCloudSave={ui.lastCloudSave}
                />
              </PanelErrorBoundary>
            </TabsContent>
          </aside>
        </main>
      </Tabs>
      
      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <>
          <MobileBottomNav
            activeCategory={getCategoryForTab(ui.sideTab)}
            onCategoryChange={(categoryId) => {
              const category = [
                { id: 'farm', firstTab: 'actions' },
                { id: 'cats', firstTab: 'breeding' },
                { id: 'social', firstTab: 'social' },
                { id: 'progress', firstTab: 'leaderboard' },
              ].find(c => c.id === categoryId);
              if (category) {
                ui.setSideTab(category.firstTab);
              }
            }}
            onOpenMenu={() => ui.setMobileMenuOpen(true)}
            badges={badgeCounts.categoryBadges}
          />
          <MobileMenuSheet
            open={ui.mobileMenuOpen}
            onOpenChange={ui.setMobileMenuOpen}
            activeTab={ui.sideTab}
            onTabChange={ui.setSideTab}
            badges={badgeCounts.tabBadges}
          />
        </>
      )}
    </AnimatedBackground>
  );
}
