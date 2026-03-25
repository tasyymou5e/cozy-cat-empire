/**
 * Test file manifest for the admin test dashboard.
 * Lists all test files in the project with their categories.
 */

export interface TestFileEntry {
  path: string;
  name: string;
  category: 'hooks' | 'hooks/game' | 'hooks/admin' | 'lib' | 'integration';
}

export const TEST_MANIFEST: TestFileEntry[] = [
  // Core hooks
  { path: 'src/hooks/__tests__/useAutoSave.test.ts', name: 'useAutoSave', category: 'hooks' },
  { path: 'src/hooks/__tests__/useBadges.test.ts', name: 'useBadges', category: 'hooks' },
  { path: 'src/hooks/__tests__/useBattlePass.test.ts', name: 'useBattlePass', category: 'hooks' },
  { path: 'src/hooks/__tests__/useBroadcastSync.test.ts', name: 'useBroadcastSync', category: 'hooks' },
  { path: 'src/hooks/__tests__/useCatGifts.test.ts', name: 'useCatGifts', category: 'hooks' },
  { path: 'src/hooks/__tests__/useChallengeAchievements.test.ts', name: 'useChallengeAchievements', category: 'hooks' },
  { path: 'src/hooks/__tests__/useCloudSave.test.ts', name: 'useCloudSave', category: 'hooks' },
  { path: 'src/hooks/__tests__/useClub.test.ts', name: 'useClub', category: 'hooks' },
  { path: 'src/hooks/__tests__/useCollectionProgress.test.ts', name: 'useCollectionProgress', category: 'hooks' },
  { path: 'src/hooks/__tests__/useConfetti.test.ts', name: 'useConfetti', category: 'hooks' },
  { path: 'src/hooks/__tests__/useCoopChallenges.test.ts', name: 'useCoopChallenges', category: 'hooks' },
  { path: 'src/hooks/__tests__/useDailyLoginRewards.test.ts', name: 'useDailyLoginRewards', category: 'hooks' },
  { path: 'src/hooks/__tests__/useDailyObjectives.test.ts', name: 'useDailyObjectives', category: 'hooks' },
  { path: 'src/hooks/__tests__/useDailyWizard.test.ts', name: 'useDailyWizard', category: 'hooks' },
  { path: 'src/hooks/__tests__/useErrorLogger.test.ts', name: 'useErrorLogger', category: 'hooks' },
  { path: 'src/hooks/__tests__/useEventSnapshots.test.ts', name: 'useEventSnapshots', category: 'hooks' },
  { path: 'src/hooks/__tests__/useFriends.test.ts', name: 'useFriends', category: 'hooks' },
  { path: 'src/hooks/__tests__/useGamificationAnalytics.test.ts', name: 'useGamificationAnalytics', category: 'hooks' },
  { path: 'src/hooks/__tests__/useGameEvents.test.ts', name: 'useGameEvents', category: 'hooks' },
  { path: 'src/hooks/__tests__/useGameMessages.test.ts', name: 'useGameMessages', category: 'hooks' },
  { path: 'src/hooks/__tests__/useGlobalLeaderboard.test.ts', name: 'useGlobalLeaderboard', category: 'hooks' },
  { path: 'src/hooks/__tests__/useGraphicsSettings.test.ts', name: 'useGraphicsSettings', category: 'hooks' },
  { path: 'src/hooks/__tests__/useHaptics.test.ts', name: 'useHaptics', category: 'hooks' },
  { path: 'src/hooks/__tests__/useKeyboardShortcuts.test.ts', name: 'useKeyboardShortcuts', category: 'hooks' },
  { path: 'src/hooks/__tests__/useLeaderboardHistory.test.ts', name: 'useLeaderboardHistory', category: 'hooks' },
  { path: 'src/hooks/__tests__/useLeaderboardRewards.test.ts', name: 'useLeaderboardRewards', category: 'hooks' },
  { path: 'src/hooks/__tests__/useLegacy.test.ts', name: 'useLegacy', category: 'hooks' },
  { path: 'src/hooks/__tests__/useLuckyWheel.test.ts', name: 'useLuckyWheel', category: 'hooks' },
  { path: 'src/hooks/__tests__/useMilestones.test.ts', name: 'useMilestones', category: 'hooks' },
  { path: 'src/hooks/__tests__/useMiniGameTrigger.test.ts', name: 'useMiniGameTrigger', category: 'hooks' },
  { path: 'src/hooks/__tests__/useNotifications.test.ts', name: 'useNotifications', category: 'hooks' },
  { path: 'src/hooks/__tests__/useOrphanDetection.test.ts', name: 'useOrphanDetection', category: 'hooks' },
  { path: 'src/hooks/__tests__/usePhotoGallery.test.ts', name: 'usePhotoGallery', category: 'hooks' },
  { path: 'src/hooks/__tests__/usePlayerPrestige.test.ts', name: 'usePlayerPrestige', category: 'hooks' },
  { path: 'src/hooks/__tests__/usePlayerProfile.test.ts', name: 'usePlayerProfile', category: 'hooks' },
  { path: 'src/hooks/__tests__/usePlayerStats.test.ts', name: 'usePlayerStats', category: 'hooks' },
  { path: 'src/hooks/__tests__/usePortraitCredits.test.ts', name: 'usePortraitCredits', category: 'hooks' },
  { path: 'src/hooks/__tests__/usePortraitReconciliation.test.ts', name: 'usePortraitReconciliation', category: 'hooks' },
  { path: 'src/hooks/__tests__/usePortraitStatus.test.ts', name: 'usePortraitStatus', category: 'hooks' },
  { path: 'src/hooks/__tests__/usePortraitStyle.test.ts', name: 'usePortraitStyle', category: 'hooks' },
  { path: 'src/hooks/__tests__/usePrefetch.test.ts', name: 'usePrefetch', category: 'hooks' },
  { path: 'src/hooks/__tests__/usePrestige.test.ts', name: 'usePrestige', category: 'hooks' },
  { path: 'src/hooks/__tests__/useRelationshipReminders.test.ts', name: 'useRelationshipReminders', category: 'hooks' },
  { path: 'src/hooks/__tests__/useSeasonalContent.test.ts', name: 'useSeasonalContent', category: 'hooks' },
  { path: 'src/hooks/__tests__/useSpecializations.test.ts', name: 'useSpecializations', category: 'hooks' },
  { path: 'src/hooks/__tests__/useTabUnlocks.test.ts', name: 'useTabUnlocks', category: 'hooks' },
  { path: 'src/hooks/__tests__/useTrading.test.ts', name: 'useTrading', category: 'hooks' },
  { path: 'src/hooks/__tests__/useVersionCheck.test.ts', name: 'useVersionCheck', category: 'hooks' },
  { path: 'src/hooks/__tests__/useWeeklyChallenges.test.ts', name: 'useWeeklyChallenges', category: 'hooks' },
  { path: 'src/hooks/__tests__/useWeeklyEvents.test.ts', name: 'useWeeklyEvents', category: 'hooks' },
  { path: 'src/hooks/__tests__/useWelcomeBack.test.ts', name: 'useWelcomeBack', category: 'hooks' },
  { path: 'src/hooks/__tests__/useAICatAdvisor.test.ts', name: 'useAICatAdvisor', category: 'hooks' },
  { path: 'src/hooks/__tests__/useAuthBackground.test.ts', name: 'useAuthBackground', category: 'hooks' },
  { path: 'src/hooks/__tests__/useAuthSounds.test.ts', name: 'useAuthSounds', category: 'hooks' },
  // Game hooks
  { path: 'src/hooks/game/__tests__/useGameCore.test.ts', name: 'useGameCore', category: 'hooks/game' },
  { path: 'src/hooks/game/__tests__/useSaveLoad.test.ts', name: 'useSaveLoad', category: 'hooks/game' },
  // Admin hooks
  { path: 'src/hooks/admin/__tests__/useAdminData.test.ts', name: 'useAdminData', category: 'hooks/admin' },
  { path: 'src/hooks/admin/__tests__/useSecurityLinter.test.ts', name: 'useSecurityLinter', category: 'hooks/admin' },
  // Lib utilities
  { path: 'src/lib/__tests__/appearanceInheritance.test.ts', name: 'appearanceInheritance', category: 'lib' },
  { path: 'src/lib/__tests__/avatarCache.test.ts', name: 'avatarCache', category: 'lib' },
  { path: 'src/lib/__tests__/breedingMatchmaking.test.ts', name: 'breedingMatchmaking', category: 'lib' },
  { path: 'src/lib/__tests__/empireTimeOfDay.test.ts', name: 'empireTimeOfDay', category: 'lib' },
  { path: 'src/lib/__tests__/relationshipUtils.test.ts', name: 'relationshipUtils', category: 'lib' },
  { path: 'src/lib/__tests__/seasonUtils.test.ts', name: 'seasonUtils', category: 'lib' },
  { path: 'src/lib/__tests__/utils.test.ts', name: 'utils', category: 'lib' },
  // Integration
  { path: 'src/hooks/__tests__/cloudSave.integration.test.ts', name: 'cloudSave (integration)', category: 'integration' },
  { path: 'src/hooks/__tests__/errorLoggerObservability.test.ts', name: 'errorLoggerObservability', category: 'integration' },
];

export const CATEGORY_LABELS: Record<string, string> = {
  hooks: 'Core Hooks',
  'hooks/game': 'Game Hooks',
  'hooks/admin': 'Admin Hooks',
  lib: 'Lib Utilities',
  integration: 'Integration Tests',
};
