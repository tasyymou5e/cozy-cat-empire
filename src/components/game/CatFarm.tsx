import { useCatFarmState, TAB_LABELS } from '@/hooks/useCatFarmState';
import { useCatFarmHandlers, MOOD_LABELS } from '@/hooks/useCatFarmHandlers';
import { GameActions } from '@/types/gameEvents';
// Decomposed components
import { CatFarmSkeleton } from './CatFarmSkeleton';
import { GameHeader } from './GameHeader';
import { GameSidebar } from './GameSidebar';
import { CatFarmDialogs } from './CatFarmDialogs';
import { CatFarmOverlays } from './CatFarmOverlays';

// Panel groups
import {
  CatManagementPanels,
  EconomyPanels,
  BreedingTrainingPanels,
  SocialPanels,
  ProgressPanels,
  SocialFeaturesPanels,
  UtilityPanels,
  PrestigePanels,
} from './panels';

// Panel and UI components
import { CompactStatusBar } from './CompactStatusBar';
import { MessageBar } from './MessageBar';
import { VirtualizedCatGrid } from './VirtualizedCatGrid';
import { MobileNavBar } from './MobileNavBar';
import { MobileGameDrawer } from './MobileGameDrawer';
import { AICatAdvisor } from './AICatAdvisor';
import { DailyWizardDialog } from './DailyWizardDialog';
import { useDailyWizard } from '@/hooks/useDailyWizard';

// UI primitives
import { AnimatedBackground } from '@/components/ui/AnimatedBackground';
import { FloatingDecorations } from '@/components/ui/FloatingDecorations';
import { Tabs } from '@/components/ui/tabs';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';

/**
 * CatFarm - Main game orchestrator component
 *
 * The central hub that manages all game panels, state, and interactions.
 * Handles cloud saves, achievements, daily rewards, notifications, and
 * coordinates between all sub-panels.
 */
export function CatFarm() {
  const farmState = useCatFarmState();
  const handlers = useCatFarmHandlers({ farmState });

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
    handleTutorialComplete,
    dispatchAction,
    handleQuickSocialize,
    clearQuickSocializePair,
    handleCloudSave,
    handleCloudLoad,
    autoSaveStatus,
    triggerManualSave,
    toggleSound,
    toggleMusic,
    handleSfxVolumeChange,
    handleMusicVolumeChange,
    // Orphan recovery handlers
    orphanedCats,
    showOrphanDialog,
    handleRecoverOrphans,
    handleDismissOrphans,
  } = handlers;

  const dailyWizard = useDailyWizard(state, relationshipSystem.relationships);

  if (auth.loading || (auth.user && !ui.hasLoadedCloud)) {
    return <CatFarmSkeleton />;
  }

  // Mobile Layout
  if (isMobile) {
    return (
      <AnimatedBackground variant="game" className="min-h-screen">
        <FloatingDecorations variant="paws" density="low" className="opacity-20" />

            <CatFarmOverlays
              onHighlightTab={ui.setHighlightedTab}
              onTutorialComplete={handleTutorialComplete}
          showShortcutsHelp={ui.showShortcutsHelp}
          onCloseShortcutsHelp={() => ui.setShowShortcutsHelp(false)}
          events={relationshipSystem.events}
          lastEventId={relationshipSystem.lastEventId}
          cats={state.cats}
          onCatClick={() => farmState.sound.playSound('click')}
          onFeed={(catId) => dispatchAction(GameActions.FEED_SINGLE_CAT, { catId })}
          onComfort={(catId) => dispatchAction(GameActions.COMFORT_CAT, { catId })}
          onHeal={(catId) => dispatchAction(GameActions.USE_MEDICINE, { catId })}
          hasFood={state.resources.food > 0}
          hasMedicine={state.resources.medicine > 0}
          currentDailyEvent={currentDailyEvent}
          onDismissDailyEvent={actions.clearDailyEvent}
        />

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
          orphanedCats={orphanedCats}
          showOrphanDialog={showOrphanDialog}
          onRecoverOrphans={handleRecoverOrphans}
          onDismissOrphans={handleDismissOrphans}
        />

        <GameHeader
          day={state.day}
          money={state.money}
          musicOn={ui.musicOn}
          soundOn={ui.soundOn}
          sfxVolume={ui.sfxVolume}
          musicVolume={ui.musicVolume}
          onToggleMusic={toggleMusic}
          onToggleSound={toggleSound}
          onSfxVolumeChange={handleSfxVolumeChange}
          onMusicVolumeChange={handleMusicVolumeChange}
          theme={theme.theme}
          onThemeChange={() => theme.setTheme(theme.theme === 'dark' ? 'light' : 'dark')}
          onShowShortcutsHelp={() => ui.setShowShortcutsHelp(true)}
          onShowWhatsNew={() => ui.setShowWhatsNew(true)}
          onShowDailyRewards={() => dailyRewards.setShowModal(true)}
          user={auth.user}
          onSignOut={auth.signOut}
          onManualSave={triggerManualSave}
          onResetGame={actions.resetGame}
          autoSaveStatus={autoSaveStatus}
          hasLoadedCloud={ui.hasLoadedCloud}
          isVIP={dailyRewards.isVIP}
          vipTier={dailyRewards.vipTier}
          canClaimDailyReward={dailyRewards.canClaim}
          isMobile
        />

        <MessageBar
          gameMessage={messageSystem.currentMessage}
          onDismiss={messageSystem.dismissMessage}
          queueCount={messageSystem.queueCount}
        />

        <Tabs value={ui.sideTab} onValueChange={ui.setSideTab} className="flex-1 flex flex-col pb-16">
          <main className="game-main">
            <section className="cat-grid-section">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-foreground">Your Cats</h2>
                <span className="text-sm text-muted-foreground">
                  {state.cats.length} / {state.space} capacity
                </span>
              </div>

              {state.cats.length === 0 ? (
                <div className="empty-state">
                  <span className="text-6xl mb-4">🐾</span>
                  <p className="text-muted-foreground mb-2">No cats yet!</p>
                  <p className="text-sm text-muted-foreground">
                    Add a stray for free or buy from the market.
                  </p>
                </div>
              ) : (
                <VirtualizedCatGrid
                  cats={state.cats}
                  relationships={relationshipSystem.relationships}
                  allCats={state.cats}
                  catCostumes={state.catCostumes}
                  variant="card"
                  getCatReaction={getCatReaction}
                  onSell={(catId) => dispatchAction('SELL_CAT', { catId })}
                  onHeal={(catId) => dispatchAction('USE_MEDICINE', { catId })}
                  onComfort={(catId) => dispatchAction('COMFORT_CAT', { catId })}
                  onRename={actions.renameCat}
                  showStats
                  showRelationships
                  showActions
                />
              )}
            </section>

            <aside className="action-sidebar">
              <CatManagementPanels
                money={state.money}
                space={state.space}
                catCount={state.cats.length}
                onAddCat={actions.addCat}
                onNextDay={actions.nextDay}
              />
              <EconomyPanels
                resources={state.resources}
                money={state.money}
                catCount={state.cats.length}
                marketListings={state.marketListings}
                hasSpace={state.cats.length < state.space}
                dispatchAction={dispatchAction}
                onBuyFromMarket={actions.buyFromMarket}
              />
              <BreedingTrainingPanels
                cats={state.cats}
                breedingCooldown={state.breedingCooldown}
                hasSpace={state.cats.length < state.space}
                treats={state.resources.treats}
                toys={state.resources.toys}
                day={state.day}
                catCostumes={state.catCostumes}
                relationships={relationshipSystem.relationships}
                money={state.money}
                ownedCostumes={state.ownedCostumes}
                dispatchAction={dispatchAction}
                getBreedingCompatibility={relationshipSystem.getBreedingCompatibility}
                onBuyCostume={actions.buyCostume}
                onEquipCostume={actions.equipCostume}
                onPortraitOutdated={showOutdatedToast}
              />
              <SocialPanels
                cats={state.cats}
                resources={state.resources}
                relationships={relationshipSystem.relationships}
                groups={relationshipSystem.groups}
                events={relationshipSystem.events}
                catCostumes={state.catCostumes}
                currentDay={state.day}
                maintenanceStreak={relationshipSystem.maintenanceStreak}
                needsAttentionCount={relationshipReminders.needsAttentionCount}
                quickSocializePair={ui.quickSocializePair}
                dispatchAction={dispatchAction}
                getRelationship={relationshipSystem.getRelationship}
                onClearSelection={clearQuickSocializePair}
                onQuickSocialize={handleQuickSocialize}
                onHealAll={actions.healAllSickCats}
                onRestAll={actions.restAllTiredCats}
                onComfortAll={actions.comfortAllUnhappyCats}
                onTrainAll={actions.trainAllAvailableCats}
                onSellSelected={actions.sellSelectedCats}
                onSocializeAll={actions.socializeAllNeglected}
              />
              <ProgressPanels
                catData={{
                  cats: state.cats,
                  relationships: relationshipSystem.relationships,
                  catCostumes: state.catCostumes,
                }}
                challenge={{
                  challenges: weeklyChallenges.challenges,
                  loading: weeklyChallenges.loading,
                  timeRemaining: weeklyChallenges.getTimeRemaining(),
                  lastProgressUpdate: weeklyChallenges.lastProgressUpdate,
                  totalCompleted: weeklyChallenges.totalChallengesCompleted,
                  currentStreak: weeklyChallenges.currentStreak,
                  longestStreak: weeklyChallenges.longestStreak,
                  onClaimReward: weeklyChallenges.claimReward,
                  onProgressAnimationComplete: weeklyChallenges.clearProgressUpdate,
                }}
                objectives={{
                  objectives: objectives.objectives,
                  allCompleted: objectives.allCompleted,
                  bonusClaimed: objectives.bonusClaimed,
                  onClaimBonus: handleClaimObjectivesBonus,
                }}
                wheel={{
                  canSpin: luckyWheel.canSpin,
                  spinsRemaining: luckyWheel.spinsRemaining,
                  isSpinning: luckyWheel.isSpinning,
                  lastPrize: luckyWheel.lastPrize,
                  totalSpins: luckyWheel.totalSpins,
                  isVIP: dailyRewards.isVIP,
                  onSpin: luckyWheel.spin,
                  onClaimPrize: handleClaimWheelPrize,
                  onClearPrize: luckyWheel.clearLastPrize,
                }}
                collection={{
                  breedProgress: collection.breedProgress,
                  personalityProgress: collection.personalityProgress,
                  costumeProgress: collection.costumeProgress,
                  trickProgress: collection.trickProgress,
                  overallProgress: collection.overallProgress,
                  completedSets: collection.progress.completedSets,
                  getSetReward: collection.getSetReward,
                }}
                feedback={{
                  playSound: farmState.sound.playSound,
                  fireConfetti: farmState.confetti.fireConfetti,
                }}
              />
              <SocialFeaturesPanels
                userId={auth.user?.id}
                cats={state.cats}
                money={state.money}
                resources={state.resources}
                catCostumes={state.catCostumes}
                friends={friends.friends}
                activeChallenges={coopChallenges.activeChallenges}
                pendingInvites={coopChallenges.pendingInvites}
                sentInvites={coopChallenges.sentInvites}
                coopTemplates={coopChallenges.templates}
                dispatchAction={dispatchAction}
                onGiftReceived={(cat) => actions.addReceivedCat?.(cat)}
                onSendCoopInvite={coopChallenges.sendInvite}
                onAcceptCoopInvite={coopChallenges.acceptInvite}
                onDeclineCoopInvite={coopChallenges.declineInvite}
                onCancelCoopInvite={coopChallenges.cancelInvite}
                onClaimCoopReward={handleClaimCoopReward}
              />
              <PrestigePanels
                cats={state.cats}
                catCostumes={state.catCostumes}
                onPrestigeCat={(catId, updates) => actions.updateCat?.(catId, updates)}
                onUnlockCostume={actions.buyCostume}
              />
              <UtilityPanels
                cats={state.cats}
                catCostumes={state.catCostumes}
                relationships={relationshipSystem.relationships}
                achievements={state.achievements}
                legacy={{
                  retiredCats: legacy.retiredCats,
                  totalLegacyBonus: legacy.totalLegacyBonus,
                  onRetireCat: handleRetireCat,
                  canRetire: legacy.canRetire,
                  getEligibility: legacy.getEligibility,
                  getKittenBonuses: legacy.getKittenBonuses,
                }}
                specialization={{
                  kittensBred: kittensBreed,
                  onSpecialize: actions.setSpecialization,
                  canSpecialize: specializations.canSpecialize,
                  getSpecialization: specializations.getSpecialization,
                  getActiveBonuses: () => specializations.getActiveBonuses(state.cats),
                }}
                battlePass={{
                  money: state.money,
                  onClaimReward: handleClaimBPReward,
                  onUpgradePremium: handleUpgradePremium,
                }}
                stats={{
                  cats: state.cats.length,
                  showWins: state.totalShowWins,
                  money: state.totalMoneyEarned,
                  breeding: kittensBreed,
                  house: state.houseSize !== 'apartment',
                  farm: state.houseSize === 'farm',
                  acres: state.acres,
                  challengesCompleted: weeklyChallenges.totalChallengesCompleted,
                }}
                saveLoad={{
                  isLoggedIn: !!auth.user,
                  cloudSyncing: ui.cloudSyncing,
                  lastCloudSave: ui.lastCloudSave,
                  onSave: auth.user ? handleCloudSave : actions.saveGame,
                  onLoad: auth.user ? handleCloudLoad : actions.loadGame,
                  hasSave: actions.hasSaveGame(),
                  lastSaveDay: actions.getSaveDay(),
                }}
              />
            </aside>
          </main>
        </Tabs>

        <MobileNavBar
          activeTab={ui.sideTab}
          onOpenMenu={() => ui.setMobileMenuOpen(true)}
          day={state.day}
          money={state.money}
        />

        <MobileGameDrawer
          open={ui.mobileMenuOpen}
          onOpenChange={ui.setMobileMenuOpen}
          activeTab={ui.sideTab}
          onTabChange={ui.setSideTab}
          badges={badgeCounts.tabBadges}
          day={state.day}
          money={state.money}
        />

        <AICatAdvisor
          cats={state.cats}
          state={state}
          onRenameCat={actions.renameCat}
          onSaveBackstory={(catId, backstory) => actions.updateCat?.(catId, { backstory })}
          onNavigateTab={ui.setSideTab}
        />

        <DailyWizardDialog
          open={dailyWizard.isOpen}
          onClose={dailyWizard.closeWizard}
          onDismissForToday={dailyWizard.dismissForToday}
          steps={dailyWizard.steps}
          currentStep={dailyWizard.currentStep}
          progress={dailyWizard.progress}
          totalSteps={dailyWizard.totalSteps}
          onNext={dailyWizard.nextStep}
          onPrev={dailyWizard.prevStep}
          onNavigateTab={(tab) => { ui.setSideTab(tab); dailyWizard.closeWizard(); }}
        />
      </AnimatedBackground>
    );
  }

  // Desktop Layout with Sidebar
  return (
    <SidebarProvider defaultOpen>
      <div className="flex min-h-screen w-full">
        <GameSidebar
          activeTab={ui.sideTab}
          onTabChange={ui.setSideTab}
          badges={badgeCounts.tabBadges}
          day={state.day}
          money={state.money}
          highlightedTab={ui.highlightedTab}
        />

        <SidebarInset className="flex flex-col flex-1 overflow-hidden">
          <AnimatedBackground variant="game" className="flex-1 flex flex-col">
            <FloatingDecorations variant="paws" density="low" className="opacity-20" />

            <CatFarmOverlays
              onHighlightTab={ui.setHighlightedTab}
              onTutorialComplete={handleTutorialComplete}
              showShortcutsHelp={ui.showShortcutsHelp}
              onCloseShortcutsHelp={() => ui.setShowShortcutsHelp(false)}
              events={relationshipSystem.events}
              lastEventId={relationshipSystem.lastEventId}
              cats={state.cats}
              onCatClick={() => farmState.sound.playSound('click')}
              onFeed={(catId) => dispatchAction(GameActions.FEED_SINGLE_CAT, { catId })}
              onComfort={(catId) => dispatchAction(GameActions.COMFORT_CAT, { catId })}
              onHeal={(catId) => dispatchAction(GameActions.USE_MEDICINE, { catId })}
              hasFood={state.resources.food > 0}
              hasMedicine={state.resources.medicine > 0}
              currentDailyEvent={currentDailyEvent}
              onDismissDailyEvent={actions.clearDailyEvent}
            />

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
              orphanedCats={orphanedCats}
              showOrphanDialog={showOrphanDialog}
              onRecoverOrphans={handleRecoverOrphans}
              onDismissOrphans={handleDismissOrphans}
            />

            <GameHeader
              day={state.day}
              money={state.money}
              musicOn={ui.musicOn}
              soundOn={ui.soundOn}
              sfxVolume={ui.sfxVolume}
              musicVolume={ui.musicVolume}
              onToggleMusic={toggleMusic}
              onToggleSound={toggleSound}
              onSfxVolumeChange={handleSfxVolumeChange}
              onMusicVolumeChange={handleMusicVolumeChange}
              theme={theme.theme}
              onThemeChange={() => theme.setTheme(theme.theme === 'dark' ? 'light' : 'dark')}
              onShowShortcutsHelp={() => ui.setShowShortcutsHelp(true)}
              onShowWhatsNew={() => ui.setShowWhatsNew(true)}
              onShowDailyRewards={() => dailyRewards.setShowModal(true)}
              user={auth.user}
              onSignOut={auth.signOut}
              onManualSave={triggerManualSave}
              onResetGame={actions.resetGame}
              autoSaveStatus={autoSaveStatus}
              hasLoadedCloud={ui.hasLoadedCloud}
              isVIP={dailyRewards.isVIP}
              vipTier={dailyRewards.vipTier}
              canClaimDailyReward={dailyRewards.canClaim}
              isMobile={isMobile}
            />

            <CompactStatusBar
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

            <MessageBar
              gameMessage={messageSystem.currentMessage}
              onDismiss={messageSystem.dismissMessage}
              queueCount={messageSystem.queueCount}
            />

            <Tabs value={ui.sideTab} onValueChange={ui.setSideTab} className="flex-1 flex flex-col overflow-hidden">
              <main className="game-main overflow-auto">
                <section className="cat-grid-section">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-foreground">Your Cats</h2>
                    <span className="text-sm text-muted-foreground">
                      {state.cats.length} / {state.space} capacity
                    </span>
                  </div>

                  {state.cats.length === 0 ? (
                    <div className="empty-state">
                      <span className="text-6xl mb-4">🐾</span>
                      <p className="text-muted-foreground mb-2">No cats yet!</p>
                      <p className="text-sm text-muted-foreground">
                        Add a stray for free or buy from the market.
                      </p>
                    </div>
                  ) : (
                    <VirtualizedCatGrid
                      cats={state.cats}
                      relationships={relationshipSystem.relationships}
                      allCats={state.cats}
                      catCostumes={state.catCostumes}
                      variant="card"
                      getCatReaction={getCatReaction}
                      onSell={(catId) => dispatchAction('SELL_CAT', { catId })}
                      onHeal={(catId) => dispatchAction('USE_MEDICINE', { catId })}
                      onComfort={(catId) => dispatchAction('COMFORT_CAT', { catId })}
                      onRename={actions.renameCat}
                      showStats
                      showRelationships
                      showActions
                    />
                  )}
                </section>

                <aside className="action-sidebar">
                  <CatManagementPanels
                    money={state.money}
                    space={state.space}
                    catCount={state.cats.length}
                    onAddCat={actions.addCat}
                    onNextDay={actions.nextDay}
                  />
                  <EconomyPanels
                    resources={state.resources}
                    money={state.money}
                    catCount={state.cats.length}
                    marketListings={state.marketListings}
                    hasSpace={state.cats.length < state.space}
                    dispatchAction={dispatchAction}
                    onBuyFromMarket={actions.buyFromMarket}
                  />
                  <BreedingTrainingPanels
                    cats={state.cats}
                    breedingCooldown={state.breedingCooldown}
                    hasSpace={state.cats.length < state.space}
                    treats={state.resources.treats}
                    toys={state.resources.toys}
                    day={state.day}
                    catCostumes={state.catCostumes}
                    relationships={relationshipSystem.relationships}
                    money={state.money}
                    ownedCostumes={state.ownedCostumes}
                    dispatchAction={dispatchAction}
                    getBreedingCompatibility={relationshipSystem.getBreedingCompatibility}
                    onBuyCostume={actions.buyCostume}
                    onEquipCostume={actions.equipCostume}
                    onPortraitOutdated={showOutdatedToast}
                  />
                  <SocialPanels
                    cats={state.cats}
                    resources={state.resources}
                    relationships={relationshipSystem.relationships}
                    groups={relationshipSystem.groups}
                    events={relationshipSystem.events}
                    catCostumes={state.catCostumes}
                    currentDay={state.day}
                    maintenanceStreak={relationshipSystem.maintenanceStreak}
                    needsAttentionCount={relationshipReminders.needsAttentionCount}
                    quickSocializePair={ui.quickSocializePair}
                    dispatchAction={dispatchAction}
                    getRelationship={relationshipSystem.getRelationship}
                    onClearSelection={clearQuickSocializePair}
                    onQuickSocialize={handleQuickSocialize}
                    onHealAll={actions.healAllSickCats}
                    onRestAll={actions.restAllTiredCats}
                    onComfortAll={actions.comfortAllUnhappyCats}
                    onTrainAll={actions.trainAllAvailableCats}
                    onSellSelected={actions.sellSelectedCats}
                    onSocializeAll={actions.socializeAllNeglected}
                  />
                  <ProgressPanels
                    catData={{
                      cats: state.cats,
                      relationships: relationshipSystem.relationships,
                      catCostumes: state.catCostumes,
                    }}
                    challenge={{
                      challenges: weeklyChallenges.challenges,
                      loading: weeklyChallenges.loading,
                      timeRemaining: weeklyChallenges.getTimeRemaining(),
                      lastProgressUpdate: weeklyChallenges.lastProgressUpdate,
                      totalCompleted: weeklyChallenges.totalChallengesCompleted,
                      currentStreak: weeklyChallenges.currentStreak,
                      longestStreak: weeklyChallenges.longestStreak,
                      onClaimReward: weeklyChallenges.claimReward,
                      onProgressAnimationComplete: weeklyChallenges.clearProgressUpdate,
                    }}
                    objectives={{
                      objectives: objectives.objectives,
                      allCompleted: objectives.allCompleted,
                      bonusClaimed: objectives.bonusClaimed,
                      onClaimBonus: handleClaimObjectivesBonus,
                    }}
                    wheel={{
                      canSpin: luckyWheel.canSpin,
                      spinsRemaining: luckyWheel.spinsRemaining,
                      isSpinning: luckyWheel.isSpinning,
                      lastPrize: luckyWheel.lastPrize,
                      totalSpins: luckyWheel.totalSpins,
                      isVIP: dailyRewards.isVIP,
                      onSpin: luckyWheel.spin,
                      onClaimPrize: handleClaimWheelPrize,
                      onClearPrize: luckyWheel.clearLastPrize,
                    }}
                    collection={{
                      breedProgress: collection.breedProgress,
                      personalityProgress: collection.personalityProgress,
                      costumeProgress: collection.costumeProgress,
                      trickProgress: collection.trickProgress,
                      overallProgress: collection.overallProgress,
                      completedSets: collection.progress.completedSets,
                      getSetReward: collection.getSetReward,
                    }}
                    feedback={{
                      playSound: farmState.sound.playSound,
                      fireConfetti: farmState.confetti.fireConfetti,
                    }}
                  />
                  <SocialFeaturesPanels
                    userId={auth.user?.id}
                    cats={state.cats}
                    money={state.money}
                    resources={state.resources}
                    catCostumes={state.catCostumes}
                    friends={friends.friends}
                    activeChallenges={coopChallenges.activeChallenges}
                    pendingInvites={coopChallenges.pendingInvites}
                    sentInvites={coopChallenges.sentInvites}
                    coopTemplates={coopChallenges.templates}
                    dispatchAction={dispatchAction}
                    onGiftReceived={(cat) => actions.addReceivedCat?.(cat)}
                    onSendCoopInvite={coopChallenges.sendInvite}
                    onAcceptCoopInvite={coopChallenges.acceptInvite}
                    onDeclineCoopInvite={coopChallenges.declineInvite}
                    onCancelCoopInvite={coopChallenges.cancelInvite}
                    onClaimCoopReward={handleClaimCoopReward}
                  />
                  <PrestigePanels
                    cats={state.cats}
                    catCostumes={state.catCostumes}
                    onPrestigeCat={(catId, updates) => actions.updateCat?.(catId, updates)}
                    onUnlockCostume={actions.buyCostume}
                  />
                  <UtilityPanels
                    cats={state.cats}
                    catCostumes={state.catCostumes}
                    relationships={relationshipSystem.relationships}
                    achievements={state.achievements}
                    legacy={{
                      retiredCats: legacy.retiredCats,
                      totalLegacyBonus: legacy.totalLegacyBonus,
                      onRetireCat: handleRetireCat,
                      canRetire: legacy.canRetire,
                      getEligibility: legacy.getEligibility,
                      getKittenBonuses: legacy.getKittenBonuses,
                    }}
                    specialization={{
                      kittensBred: kittensBreed,
                      onSpecialize: actions.setSpecialization,
                      canSpecialize: specializations.canSpecialize,
                      getSpecialization: specializations.getSpecialization,
                      getActiveBonuses: () => specializations.getActiveBonuses(state.cats),
                    }}
                    battlePass={{
                      money: state.money,
                      onClaimReward: handleClaimBPReward,
                      onUpgradePremium: handleUpgradePremium,
                    }}
                    stats={{
                      cats: state.cats.length,
                      showWins: state.totalShowWins,
                      money: state.totalMoneyEarned,
                      breeding: kittensBreed,
                      house: state.houseSize !== 'apartment',
                      farm: state.houseSize === 'farm',
                      acres: state.acres,
                      challengesCompleted: weeklyChallenges.totalChallengesCompleted,
                    }}
                    saveLoad={{
                      isLoggedIn: !!auth.user,
                      cloudSyncing: ui.cloudSyncing,
                      lastCloudSave: ui.lastCloudSave,
                      onSave: auth.user ? handleCloudSave : actions.saveGame,
                      onLoad: auth.user ? handleCloudLoad : actions.loadGame,
                      hasSave: actions.hasSaveGame(),
                      lastSaveDay: actions.getSaveDay(),
                    }}
                  />
                </aside>
              </main>
            </Tabs>
            <AICatAdvisor
              cats={state.cats}
              state={state}
              onRenameCat={actions.renameCat}
              onSaveBackstory={(catId, backstory) => actions.updateCat?.(catId, { backstory })}
              onNavigateTab={ui.setSideTab}
            />

            <DailyWizardDialog
              open={dailyWizard.isOpen}
              onClose={dailyWizard.closeWizard}
              onDismissForToday={dailyWizard.dismissForToday}
              steps={dailyWizard.steps}
              currentStep={dailyWizard.currentStep}
              progress={dailyWizard.progress}
              totalSteps={dailyWizard.totalSteps}
              onNext={dailyWizard.nextStep}
              onPrev={dailyWizard.prevStep}
              onNavigateTab={(tab) => { ui.setSideTab(tab); dailyWizard.closeWizard(); }}
            />
          </AnimatedBackground>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
