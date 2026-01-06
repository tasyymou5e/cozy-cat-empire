import { useCatFarmState, TAB_LABELS } from '@/hooks/useCatFarmState';
import { useCatFarmHandlers, MOOD_LABELS } from '@/hooks/useCatFarmHandlers';

// Decomposed components
import { CatFarmSkeleton } from './CatFarmSkeleton';
import { CatFarmHeader } from './CatFarmHeader';
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
} from './panels';

// Panel and UI components
import { StatusBar } from './StatusBar';
import { MessageBar } from './MessageBar';
import { UnifiedCatCard } from './UnifiedCatCard';
import { CategoryTabBar, getCategoryForTab } from './CategoryTabBar';
import { MobileBottomNav } from './MobileBottomNav';
import { MobileMenuSheet } from './MobileMenuSheet';

// UI primitives
import { AnimatedBackground } from '@/components/ui/AnimatedBackground';
import { FloatingDecorations } from '@/components/ui/FloatingDecorations';
import { Tabs } from '@/components/ui/tabs';

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
    auth, isMobile, getCatReaction, state, actions, kittensBreed, currentDailyEvent,
    relationshipSystem, messageSystem, showOutdatedToast, relationshipReminders,
    weeklyChallenges, dailyRewards, gifts, trading, milestones, objectives,
    collection, luckyWheel, legacy, specializations, battlePass, friends,
    coopChallenges, badgeCounts, ui, theme,
  } = farmState;

  const {
    handleAcceptGiftFromPopup, handleDeclineGiftFromPopup, handleAcceptTradeFromPopup,
    handleDeclineTradeFromPopup, handleClaimDailyReward, handleClaimMilestone,
    handleClaimObjectivesBonus, handleClaimWheelPrize, handleClaimBPReward,
    handleUpgradePremium, handleClaimCoopReward, handleRetireCat, dispatchAction,
    handleQuickSocialize, clearQuickSocializePair, handleCloudSave, handleCloudLoad,
    toggleSound, toggleMusic, handleSfxVolumeChange, handleMusicVolumeChange,
  } = handlers;

  if (auth.loading || (auth.user && !ui.hasLoadedCloud)) {
    return <CatFarmSkeleton />;
  }

  return (
    <AnimatedBackground variant="game" className="min-h-screen">
      <FloatingDecorations variant="paws" density="low" className="opacity-20" />
      
      <CatFarmOverlays
        onHighlightTab={ui.setHighlightedTab}
        showShortcutsHelp={ui.showShortcutsHelp}
        onCloseShortcutsHelp={() => ui.setShowShortcutsHelp(false)}
        events={relationshipSystem.events}
        lastEventId={relationshipSystem.lastEventId}
        cats={state.cats}
        onCatClick={() => farmState.sound.playSound('click')}
        onFeed={(catId) => dispatchAction('FEED_SINGLE_CAT', { catId })}
        onComfort={(catId) => dispatchAction('COMFORT_CAT', { catId })}
        onHeal={(catId) => dispatchAction('USE_MEDICINE', { catId })}
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
      />
      
      <CatFarmHeader
        musicOn={ui.musicOn} soundOn={ui.soundOn} currentMoodLabel={ui.currentMoodLabel}
        sfxVolume={ui.sfxVolume} musicVolume={ui.musicVolume}
        onToggleMusic={toggleMusic} onToggleSound={toggleSound}
        onSfxVolumeChange={handleSfxVolumeChange} onMusicVolumeChange={handleMusicVolumeChange}
        theme={theme.theme} onThemeChange={() => theme.setTheme(theme.theme === 'dark' ? 'light' : 'dark')}
        recentTabs={ui.recentTabs} onNavigateTab={ui.setSideTab}
        onShowShortcutsHelp={() => ui.setShowShortcutsHelp(true)}
        onShowWhatsNew={() => ui.setShowWhatsNew(true)}
        onShowDailyRewards={() => dailyRewards.setShowModal(true)}
        user={auth.user} onSignOut={auth.signOut}
        lastCloudSave={ui.lastCloudSave} cloudSyncing={ui.cloudSyncing}
        onCloudSave={handleCloudSave} onLocalSave={actions.saveGame} onResetGame={actions.resetGame}
        isVIP={dailyRewards.isVIP} vipTier={dailyRewards.vipTier}
        canClaimDailyReward={dailyRewards.canClaim} isMobile={isMobile}
      />

      <StatusBar 
        day={state.day} money={state.money} cats={state.cats} space={state.space}
        houseSize={state.houseSize} acres={state.acres} totalShowWins={state.totalShowWins}
        showCooldown={state.showCooldown} onUpgrade={actions.upgradeHouse} 
        onCatShow={(tier) => dispatchAction('CAT_SHOW', { tier })} 
        relationships={relationshipSystem.relationships} 
      />
      <MessageBar gameMessage={messageSystem.currentMessage} onDismiss={messageSystem.dismissMessage} queueCount={messageSystem.queueCount} />

      <Tabs value={ui.sideTab} onValueChange={ui.setSideTab} className={`flex-1 flex flex-col ${isMobile ? 'pb-16' : ''}`}>
        <div className={`sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border ${isMobile ? 'px-2' : 'px-4'} py-2`}>
          <CategoryTabBar activeTab={ui.sideTab} onTabChange={ui.setSideTab} highlightedTab={ui.highlightedTab} badges={badgeCounts.tabBadges} />
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
                    key={cat.id} cat={cat} variant="card"
                    equippedCostumeId={state.catCostumes[cat.id]}
                    onSell={(catId) => dispatchAction('SELL_CAT', { catId })} 
                    onHeal={(catId) => dispatchAction('USE_MEDICINE', { catId })}
                    onComfort={(catId) => dispatchAction('COMFORT_CAT', { catId })}
                    onRename={actions.renameCat}
                    relationships={relationshipSystem.relationships} allCats={state.cats}
                    reaction={getCatReaction(cat.id)} showStats showRelationships showActions
                  />
                ))}
              </div>
            )}
          </section>

          <aside className="action-sidebar">
            <CatManagementPanels money={state.money} space={state.space} catCount={state.cats.length} onAddCat={actions.addCat} onNextDay={actions.nextDay} />
            <EconomyPanels resources={state.resources} money={state.money} catCount={state.cats.length} marketListings={state.marketListings} hasSpace={state.cats.length < state.space} dispatchAction={dispatchAction} onBuyFromMarket={actions.buyFromMarket} />
            <BreedingTrainingPanels cats={state.cats} breedingCooldown={state.breedingCooldown} hasSpace={state.cats.length < state.space} treats={state.resources.treats} toys={state.resources.toys} day={state.day} catCostumes={state.catCostumes} relationships={relationshipSystem.relationships} money={state.money} ownedCostumes={state.ownedCostumes} dispatchAction={dispatchAction} getBreedingCompatibility={relationshipSystem.getBreedingCompatibility} onBuyCostume={actions.buyCostume} onEquipCostume={actions.equipCostume} onPortraitOutdated={showOutdatedToast} />
            <SocialPanels cats={state.cats} resources={state.resources} relationships={relationshipSystem.relationships} groups={relationshipSystem.groups} events={relationshipSystem.events} catCostumes={state.catCostumes} currentDay={state.day} maintenanceStreak={relationshipSystem.maintenanceStreak} needsAttentionCount={relationshipReminders.needsAttentionCount} quickSocializePair={ui.quickSocializePair} dispatchAction={dispatchAction} getRelationship={relationshipSystem.getRelationship} onClearSelection={clearQuickSocializePair} onQuickSocialize={handleQuickSocialize} onHealAll={actions.healAllSickCats} onRestAll={actions.restAllTiredCats} onComfortAll={actions.comfortAllUnhappyCats} onTrainAll={actions.trainAllAvailableCats} onSellSelected={actions.sellSelectedCats} onSocializeAll={actions.socializeAllNeglected} />
            <ProgressPanels 
              catData={{ cats: state.cats, relationships: relationshipSystem.relationships, catCostumes: state.catCostumes }}
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
              feedback={{ playSound: farmState.sound.playSound, fireConfetti: farmState.confetti.fireConfetti }}
            />
            <SocialFeaturesPanels userId={auth.user?.id} cats={state.cats} money={state.money} resources={state.resources} catCostumes={state.catCostumes} friends={friends.friends} activeChallenges={coopChallenges.activeChallenges} pendingInvites={coopChallenges.pendingInvites} sentInvites={coopChallenges.sentInvites} coopTemplates={coopChallenges.templates} dispatchAction={dispatchAction} onGiftReceived={(cat) => actions.addReceivedCat?.(cat)} onSendCoopInvite={coopChallenges.sendInvite} onAcceptCoopInvite={coopChallenges.acceptInvite} onDeclineCoopInvite={coopChallenges.declineInvite} onCancelCoopInvite={coopChallenges.cancelInvite} onClaimCoopReward={handleClaimCoopReward} />
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
              if (category) ui.setSideTab(category.firstTab);
            }}
            onOpenMenu={() => ui.setMobileMenuOpen(true)}
            badges={badgeCounts.categoryBadges}
          />
          <MobileMenuSheet open={ui.mobileMenuOpen} onOpenChange={ui.setMobileMenuOpen} activeTab={ui.sideTab} onTabChange={ui.setSideTab} badges={badgeCounts.tabBadges} />
        </>
      )}
    </AnimatedBackground>
  );
}
