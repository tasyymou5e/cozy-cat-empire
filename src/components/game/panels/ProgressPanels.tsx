import { TabsContent } from '@/components/ui/tabs';
import { PanelErrorBoundary } from '../PanelErrorBoundary';
import { LeaderboardPanel } from '../LeaderboardPanel';
import { WeeklyChallengesPanel } from '../WeeklyChallengesPanel';
import { DailyObjectivesPanel } from '../DailyObjectivesPanel';
import { CollectionProgressPanel } from '../CollectionProgressPanel';
import { LuckyWheelPanel } from '../LuckyWheelPanel';
import type { 
  SharedCatDataProps, 
  ChallengeProps, 
  ObjectivesProps, 
  WheelProps, 
  CollectionProps,
  FeedbackProps 
} from './types';

interface ProgressPanelsProps {
  /** Shared cat data (cats, relationships, costumes) */
  catData: SharedCatDataProps;
  /** Weekly challenges data and handlers */
  challenge: ChallengeProps;
  /** Daily objectives data and handlers */
  objectives: ObjectivesProps;
  /** Lucky wheel data and handlers */
  wheel: WheelProps;
  /** Collection progress data */
  collection: CollectionProps;
  /** Audio/visual feedback functions */
  feedback: FeedbackProps;
}

/**
 * Progress and reward panels: Leaderboard, Challenges, Objectives, Collection, Lucky Wheel
 */
export function ProgressPanels({
  catData,
  challenge,
  objectives,
  wheel,
  collection,
  feedback,
}: ProgressPanelsProps) {
  return (
    <>
      <TabsContent value="leaderboard" className="mt-0">
        <PanelErrorBoundary panelName="LeaderboardPanel">
          <LeaderboardPanel 
            cats={catData.cats} 
            relationships={catData.relationships} 
            catCostumes={catData.catCostumes} 
          />
        </PanelErrorBoundary>
      </TabsContent>
      <TabsContent value="challenges" className="mt-0">
        <PanelErrorBoundary panelName="WeeklyChallengesPanel">
          <WeeklyChallengesPanel
            challenges={challenge.challenges}
            loading={challenge.loading}
            timeRemaining={challenge.timeRemaining}
            onClaimReward={challenge.onClaimReward}
            onRewardClaimed={() => {
              feedback.playSound('coin');
              feedback.fireConfetti();
            }}
            lastProgressUpdate={challenge.lastProgressUpdate}
            onProgressAnimationComplete={challenge.onProgressAnimationComplete}
            totalChallengesCompleted={challenge.totalCompleted}
            currentStreak={challenge.currentStreak}
            longestStreak={challenge.longestStreak}
          />
        </PanelErrorBoundary>
      </TabsContent>
      <TabsContent value="objectives" className="mt-0">
        <PanelErrorBoundary panelName="DailyObjectivesPanel">
          <DailyObjectivesPanel
            objectives={objectives.objectives}
            allCompleted={objectives.allCompleted}
            bonusClaimed={objectives.bonusClaimed}
            onClaimBonus={objectives.onClaimBonus}
          />
        </PanelErrorBoundary>
      </TabsContent>
      <TabsContent value="wheel" className="mt-0">
        <PanelErrorBoundary panelName="LuckyWheelPanel">
          <LuckyWheelPanel
            canSpin={wheel.canSpin}
            spinsRemaining={wheel.spinsRemaining}
            isSpinning={wheel.isSpinning}
            lastPrize={wheel.lastPrize}
            totalSpins={wheel.totalSpins}
            isVIP={wheel.isVIP}
            onSpin={wheel.onSpin}
            onClaimPrize={wheel.onClaimPrize}
            onClearPrize={wheel.onClearPrize}
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
            completedSets={collection.completedSets}
            getSetReward={collection.getSetReward}
          />
        </PanelErrorBoundary>
      </TabsContent>
    </>
  );
}

// Re-export types for external use
export type { ProgressPanelsProps };
