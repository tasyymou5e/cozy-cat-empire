import { TabsContent } from '@/components/ui/tabs';
import { PanelErrorBoundary } from '../PanelErrorBoundary';
import { SocializePanel } from '../SocializePanel';
import { MatchmakingPanel } from '../MatchmakingPanel';
import { GroupActivitiesPanel } from '../GroupActivitiesPanel';
import { RelationshipPanel } from '../RelationshipPanel';
import { BulkActionsPanel } from '../BulkActionsPanel';
import { Cat, Resources } from '@/types/game';
import { CatRelationship, CatGroup, RelationshipEvent } from '@/types/relationships';

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
        </PanelErrorBoundary>
      </TabsContent>
      <TabsContent value="social" className="mt-0 space-y-4">
        <PanelErrorBoundary panelName="SocialPanels">
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
          <MatchmakingPanel 
            cats={cats} 
            relationships={relationships}
            onSocialize={(cat1Id, cat2Id) => dispatchAction('SOCIALIZE_CATS', { cat1Id, cat2Id })} 
            treats={resources.treats} 
            catCostumes={catCostumes} 
          />
          <GroupActivitiesPanel 
            cats={cats} 
            groups={groups}
            treats={resources.treats} 
            toys={resources.toys} 
            onGroupActivity={(groupId, activityType) => dispatchAction('GROUP_ACTIVITY', { groupId, activityType })} 
            catCostumes={catCostumes} 
          />
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
        </PanelErrorBoundary>
      </TabsContent>
    </>
  );
}
