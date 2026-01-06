/**
 * Barrel export for all custom hooks
 * 
 * Usage: import { useCloudSave, useFriends, useConfetti } from '@/hooks';
 */

// Game hooks
export * from './game';
export { useRelationships } from './useRelationships';
export { useGameEvents } from './useGameEvents';

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
export { useCloudGallery } from './useCloudGallery';
export { usePhotoGallery } from './usePhotoGallery';
export { useConfetti } from './useConfetti';
export { useSoundEffects } from './useSoundEffects';
export { useHaptics } from './useHaptics';
export { usePortraitCredits } from './usePortraitCredits';
export { usePortraitOutdatedToast } from './usePortraitOutdatedToast';
export { useLuckyWheel } from './useLuckyWheel';
export { useSpecializations } from './useSpecializations';
export { useLegacy } from './useLegacy';

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
