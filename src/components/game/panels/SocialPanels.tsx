import { lazy, Suspense } from 'react';
import { TabsContent } from '@/components/ui/tabs';
import { PanelErrorBoundary } from '../PanelErrorBoundary';
import { PanelSkeleton } from '../PanelSkeleton';
import { Cat, Resources } from '@/types/game';
import { CatRelationship, CatGroup, RelationshipEvent } from '@/types/relationships';

// Lazy load panels for performance
const SocializePanel = lazy(() => import('../SocializePanel').then(m => ({ default: m.SocializePanel })));
const MatchmakingPanel = lazy(() => import('../MatchmakingPanel').then(m => ({ default: m.MatchmakingPanel })));
const GroupActivitiesPanel = lazy(() => import('../GroupActivitiesPanel').then(m => ({ default: m.GroupActivitiesPanel })));
const RelationshipPanel = lazy(() => import('../RelationshipPanel').then(m => ({ default: m.RelationshipPanel })));
const BulkActionsPanel = lazy(() => import('../BulkActionsPanel').then(m => ({ default: m.BulkActionsPanel })));

interface SocialPanelsProps {
  cats: Cat[];
  resources: Resources;
  relationships: CatRelationship[];
  groups: CatGroup[];
  events: RelationshipEvent[];
  catCostumes: Record<string, string>;
  currentDay: number;
  maintenanceStreak: number;
  needsAttentionCount: number;
  quickSocializePair?: { cat1Id: string; cat2Id: string } | null;
  dispatchAction: (type: string, payload?: Record<string, unknown>) => void;
  getRelationship: (cat1Id: string, cat2Id: string) => CatRelationship | undefined;
  onClearSelection: () => void;
  onQuickSocialize: (cat1Id: string, cat2Id: string) => void;
  onHealAll: () => void;
  onRestAll: () => void;
  onComfortAll: () => void;
  onTrainAll: () => void;
  onSellSelected: (catIds: string[]) => void;
  onSocializeAll: () => void;
}

/**
 * Social and relationship panels: Bulk Actions, Social (Socialize, Matchmaking, Group Activities, Relationships)
 * Uses React.lazy for code splitting and improved initial load performance.
 */
export function SocialPanels({
  cats,
  resources,
  relationships,
  groups,
  events,
  catCostumes,
  currentDay,
  maintenanceStreak,
  needsAttentionCount,
  quickSocializePair,
  dispatchAction,
  getRelationship,
  onClearSelection,
  onQuickSocialize,
  onHealAll,
  onRestAll,
  onComfortAll,
  onTrainAll,
  onSellSelected,
  onSocializeAll,
}: SocialPanelsProps) {
  return (
    <>
      <TabsContent value="bulk" className="mt-0">
        <PanelErrorBoundary panelName="BulkActionsPanel">
          <Suspense fallback={<PanelSkeleton rows={5} />}>
            <BulkActionsPanel 
              cats={cats}
              resources={resources}
              day={currentDay}
              relationships={relationships}
              onHealAll={onHealAll}
              onRestAll={onRestAll}
              onComfortAll={onComfortAll}
              onTrainAll={onTrainAll}
              onSellSelected={onSellSelected}
              onSocializeAll={onSocializeAll}
              catCostumes={catCostumes}
            />
          </Suspense>
        </PanelErrorBoundary>
      </TabsContent>
      <TabsContent value="social" className="mt-0 space-y-4">
        <PanelErrorBoundary panelName="SocialPanels">
          <Suspense fallback={<PanelSkeleton rows={3} />}>
            <SocializePanel 
              cats={cats} 
              treats={resources.treats}
              getRelationship={getRelationship} 
              onSocialize={(cat1Id, cat2Id) => dispatchAction('SOCIALIZE_CATS', { cat1Id, cat2Id })} 
              catCostumes={catCostumes}
              initialCat1Id={quickSocializePair?.cat1Id} 
              initialCat2Id={quickSocializePair?.cat2Id} 
              onClearSelection={onClearSelection} 
            />
          </Suspense>
          <Suspense fallback={<PanelSkeleton rows={2} showHeader={false} />}>
            <MatchmakingPanel 
              cats={cats} 
              relationships={relationships}
              onSocialize={(cat1Id, cat2Id) => dispatchAction('SOCIALIZE_CATS', { cat1Id, cat2Id })} 
              treats={resources.treats} 
              catCostumes={catCostumes} 
            />
          </Suspense>
          <Suspense fallback={<PanelSkeleton rows={2} showHeader={false} />}>
            <GroupActivitiesPanel 
              cats={cats} 
              groups={groups}
              treats={resources.treats} 
              toys={resources.toys} 
              onGroupActivity={(groupId, activityType) => dispatchAction('GROUP_ACTIVITY', { groupId, activityType })} 
              catCostumes={catCostumes} 
            />
          </Suspense>
          <Suspense fallback={<PanelSkeleton rows={3} showHeader={false} />}>
            <RelationshipPanel 
              cats={cats} 
              relationships={relationships}
              groups={groups} 
              events={events} 
              catCostumes={catCostumes}
              currentDay={currentDay} 
              maintenanceStreak={maintenanceStreak} 
              needsAttentionCount={needsAttentionCount} 
              onQuickSocialize={onQuickSocialize} 
            />
          </Suspense>
        </PanelErrorBoundary>
      </TabsContent>
    </>
  );
}
