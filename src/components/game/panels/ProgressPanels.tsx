import { lazy, Suspense } from 'react';
import { TabsContent } from '@/components/ui/tabs';
import { PanelErrorBoundary } from '../PanelErrorBoundary';
import { PanelSkeleton } from '../PanelSkeleton';
import type { 
  SharedCatDataProps, 
  ChallengeProps, 
  ObjectivesProps, 
  WheelProps, 
  CollectionProps,
  FeedbackProps 
} from './types';

// Lazy load panels for performance
const LeaderboardPanel = lazy(() => import('../LeaderboardPanel').then(m => ({ default: m.LeaderboardPanel })));
const WeeklyChallengesPanel = lazy(() => import('../WeeklyChallengesPanel').then(m => ({ default: m.WeeklyChallengesPanel })));
const DailyObjectivesPanel = lazy(() => import('../DailyObjectivesPanel').then(m => ({ default: m.DailyObjectivesPanel })));
const CollectionProgressPanel = lazy(() => import('../CollectionProgressPanel').then(m => ({ default: m.CollectionProgressPanel })));
const LuckyWheelPanel = lazy(() => import('../LuckyWheelPanel').then(m => ({ default: m.LuckyWheelPanel })));

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
 * Uses React.lazy for code splitting and improved initial load performance.
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
          <Suspense fallback={<PanelSkeleton rows={5} />}>
            <LeaderboardPanel 
              cats={catData.cats} 
              relationships={catData.relationships} 
              catCostumes={catData.catCostumes} 
            />
          </Suspense>
        </PanelErrorBoundary>
      </TabsContent>
      <TabsContent value="challenges" className="mt-0">
        <PanelErrorBoundary panelName="WeeklyChallengesPanel">
          <Suspense fallback={<PanelSkeleton rows={4} />}>
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
          </Suspense>
        </PanelErrorBoundary>
      </TabsContent>
      <TabsContent value="objectives" className="mt-0">
        <PanelErrorBoundary panelName="DailyObjectivesPanel">
          <Suspense fallback={<PanelSkeleton rows={4} />}>
            <DailyObjectivesPanel
              objectives={objectives.objectives}
              allCompleted={objectives.allCompleted}
              bonusClaimed={objectives.bonusClaimed}
              onClaimBonus={objectives.onClaimBonus}
            />
          </Suspense>
        </PanelErrorBoundary>
      </TabsContent>
      <TabsContent value="wheel" className="mt-0">
        <PanelErrorBoundary panelName="LuckyWheelPanel">
          <Suspense fallback={<PanelSkeleton rows={3} showButtons={false} />}>
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
          </Suspense>
        </PanelErrorBoundary>
      </TabsContent>
      <TabsContent value="collection" className="mt-0">
        <PanelErrorBoundary panelName="CollectionProgressPanel">
          <Suspense fallback={<PanelSkeleton rows={4} />}>
            <CollectionProgressPanel
              breedProgress={collection.breedProgress}
              personalityProgress={collection.personalityProgress}
              costumeProgress={collection.costumeProgress}
              trickProgress={collection.trickProgress}
              overallProgress={collection.overallProgress}
              completedSets={collection.completedSets}
              getSetReward={collection.getSetReward}
            />
          </Suspense>
        </PanelErrorBoundary>
      </TabsContent>
    </>
  );
}

// Re-export types for external use
export type { ProgressPanelsProps };
