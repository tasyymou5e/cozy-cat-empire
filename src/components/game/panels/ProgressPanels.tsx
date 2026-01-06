import { TabsContent } from '@/components/ui/tabs';
import { PanelErrorBoundary } from '../PanelErrorBoundary';
import { LeaderboardPanel } from '../LeaderboardPanel';
import { WeeklyChallengesPanel } from '../WeeklyChallengesPanel';
import { DailyObjectivesPanel } from '../DailyObjectivesPanel';
import { CollectionProgressPanel } from '../CollectionProgressPanel';
import { LuckyWheelPanel } from '../LuckyWheelPanel';
import { Cat } from '@/types/game';
import { CatRelationship } from '@/types/relationships';
import type { DailyObjective } from '@/types/dailyObjectives';
import type { ChallengeWithProgress, ChallengeType } from '@/types/challenges';
import type { CollectionCategory } from '@/types/collections';
import type { WheelPrize } from '@/types/luckyWheel';

interface CollectionSetProgress {
  collected: number;
  total: number;
  items: { id: string; name: string; emoji: string; collected: boolean }[];
}

interface ProgressPanelsProps {
  cats: Cat[];
  relationships: CatRelationship[];
  catCostumes: Record<string, string>;
  challenges: ChallengeWithProgress[];
  challengesLoading: boolean;
  challengeTimeRemaining: string | null;
  lastProgressUpdate: { type: ChallengeType; value: number } | null;
  totalChallengesCompleted: number;
  currentStreak: number;
  longestStreak: number;
  objectives: DailyObjective[];
  allObjectivesCompleted: boolean;
  objectivesBonusClaimed: boolean;
  breedProgress: CollectionSetProgress;
  personalityProgress: CollectionSetProgress;
  costumeProgress: CollectionSetProgress;
  trickProgress: CollectionSetProgress;
  overallProgress: number;
  completedSets: CollectionCategory[];
  canSpin: boolean;
  spinsRemaining: number;
  isSpinning: boolean;
  lastPrize: WheelPrize | null;
  totalSpins: number;
  isVIP: boolean;
  playSound: (sound: string) => void;
  fireConfetti: () => void;
  onClaimChallengeReward: (challengeId: string) => Promise<{ coins: number; badge: string | null } | false>;
  onProgressAnimationComplete: () => void;
  onClaimObjectivesBonus: () => void;
  getSetReward: (category: CollectionCategory) => { coins?: number; title?: string; bonus?: string };
  onSpin: () => void;
  onClaimWheelPrize: (prize: WheelPrize) => void;
  onClearPrize: () => void;
}

/**
 * Progress and reward panels: Leaderboard, Challenges, Objectives, Collection, Lucky Wheel
 */
export function ProgressPanels({
  cats,
  relationships,
  catCostumes,
  challenges,
  challengesLoading,
  challengeTimeRemaining,
  lastProgressUpdate,
  totalChallengesCompleted,
  currentStreak,
  longestStreak,
  objectives,
  allObjectivesCompleted,
  objectivesBonusClaimed,
  breedProgress,
  personalityProgress,
  costumeProgress,
  trickProgress,
  overallProgress,
  completedSets,
  canSpin,
  spinsRemaining,
  isSpinning,
  lastPrize,
  totalSpins,
  isVIP,
  playSound,
  fireConfetti,
  onClaimChallengeReward,
  onProgressAnimationComplete,
  onClaimObjectivesBonus,
  getSetReward,
  onSpin,
  onClaimWheelPrize,
  onClearPrize,
}: ProgressPanelsProps) {
  return (
    <>
      <TabsContent value="leaderboard" className="mt-0">
        <PanelErrorBoundary panelName="LeaderboardPanel">
          <LeaderboardPanel cats={cats} relationships={relationships} catCostumes={catCostumes} />
        </PanelErrorBoundary>
      </TabsContent>
      <TabsContent value="challenges" className="mt-0">
        <PanelErrorBoundary panelName="WeeklyChallengesPanel">
          <WeeklyChallengesPanel
            challenges={challenges}
            loading={challengesLoading}
            timeRemaining={challengeTimeRemaining}
            onClaimReward={onClaimChallengeReward}
            onRewardClaimed={() => {
              playSound('coin');
              fireConfetti();
            }}
            lastProgressUpdate={lastProgressUpdate}
            onProgressAnimationComplete={onProgressAnimationComplete}
            totalChallengesCompleted={totalChallengesCompleted}
            currentStreak={currentStreak}
            longestStreak={longestStreak}
          />
        </PanelErrorBoundary>
      </TabsContent>
      <TabsContent value="objectives" className="mt-0">
        <PanelErrorBoundary panelName="DailyObjectivesPanel">
          <DailyObjectivesPanel
            objectives={objectives}
            allCompleted={allObjectivesCompleted}
            bonusClaimed={objectivesBonusClaimed}
            onClaimBonus={onClaimObjectivesBonus}
          />
        </PanelErrorBoundary>
      </TabsContent>
      <TabsContent value="wheel" className="mt-0">
        <PanelErrorBoundary panelName="LuckyWheelPanel">
          <LuckyWheelPanel
            canSpin={canSpin}
            spinsRemaining={spinsRemaining}
            isSpinning={isSpinning}
            lastPrize={lastPrize}
            totalSpins={totalSpins}
            isVIP={isVIP}
            onSpin={onSpin}
            onClaimPrize={onClaimWheelPrize}
            onClearPrize={onClearPrize}
          />
        </PanelErrorBoundary>
      </TabsContent>
      <TabsContent value="collection" className="mt-0">
        <PanelErrorBoundary panelName="CollectionProgressPanel">
          <CollectionProgressPanel
            breedProgress={breedProgress}
            personalityProgress={personalityProgress}
            costumeProgress={costumeProgress}
            trickProgress={trickProgress}
            overallProgress={overallProgress}
            completedSets={completedSets}
            getSetReward={getSetReward}
          />
        </PanelErrorBoundary>
      </TabsContent>
    </>
  );
}
