/**
 * @fileoverview Barrel export for all custom hooks
 *
 * Usage: import { useCloudSave, useFriends, useConfetti } from '@/hooks';
 *
 * @module hooks
 */

// Game hooks
export * from './game';
export { useRelationships } from './useRelationships';
export { useGameEvents } from './useGameEvents';

// CatFarm state management
export { useCatFarmState, TAB_LABELS } from './useCatFarmState';
export type { CatFarmState } from './useCatFarmState';
export { useCatFarmHandlers, MOOD_LABELS } from './useCatFarmHandlers';
export type { CatFarmHandlers } from './useCatFarmHandlers';
export { useCatFarmUIState } from './useCatFarmUIState';
export type { CatFarmUIState } from './useCatFarmUIState';
export { useCatFarmSystems } from './useCatFarmSystems';
export type { CatFarmSystems } from './useCatFarmSystems';

// Handler hooks
export * from './handlers';

// Admin hooks (grouped)
export * from './admin';

// Social hooks
export { useFriends } from './useFriends';
export { useCatGifts } from './useCatGifts';
export { useTrading } from './useTrading';
export { useNotifications } from './useNotifications';
export { useCoopChallenges } from './useCoopChallenges';

// Progress & rewards hooks
export { useBattlePass } from './useBattlePass';
export { useWeeklyChallenges } from './useWeeklyChallenges';
export { useDailyLoginRewards } from './useDailyLoginRewards';
export { useDailyObjectives } from './useDailyObjectives';
export { useCollectionProgress } from './useCollectionProgress';
export { useChallengeAchievements } from './useChallengeAchievements';

// Leaderboard hooks
export { useGlobalLeaderboard } from './useGlobalLeaderboard';
export { useLeaderboardHistory } from './useLeaderboardHistory';
export { useLeaderboardRewards } from './useLeaderboardRewards';
export { usePlayerStats } from './usePlayerStats';

// Feature hooks
export { useCloudSave } from './useCloudSave';
export { useAutoSave } from './useAutoSave';
export { useCloudGallery } from './useCloudGallery';
export { usePhotoGallery } from './usePhotoGallery';
export { useConfetti } from './useConfetti';
export { useSound } from '@/contexts/SoundContext';
export type { SoundType, MusicMood } from '@/contexts/SoundContext';
export { useHaptics } from './useHaptics';
export { usePortraitCredits } from './usePortraitCredits';
export { usePortraitOutdatedToast } from './usePortraitOutdatedToast';
export { useLuckyWheel } from './useLuckyWheel';
export { useSpecializations, getMasteryLevel, getNextMasteryLevel } from './useSpecializations';
export { useLegacy } from './useLegacy';
export { useBroadcastSync, SYNC_MESSAGES } from './useBroadcastSync';
export type { SyncMessageType } from './useBroadcastSync';

// UI hooks
export { useKeyboardShortcuts } from './useKeyboardShortcuts';
export { useGraphicsSettings } from './useGraphicsSettings';
export { useMilestones } from './useMilestones';
export { useInfiniteScroll } from './useInfiniteScroll';
export { useBadgeCounts } from './useBadgeCounts';
export { useRelationshipReminders } from './useRelationshipReminders';

// Utility hooks
export { useErrorLogger } from './useErrorLogger';
export { usePlayerProfile } from './usePlayerProfile';
export { usePlayerActivityLog, logPlayerActivity } from './usePlayerActivityLog';
export { useGameMessages } from './useGameMessages';
export type { GameMessage, MessageType, MessagePriority, MessageOptions } from './useGameMessages';

// Re-export common shadcn hooks
export { useToast, toast } from './use-toast';
export { useIsMobile } from './use-mobile';
