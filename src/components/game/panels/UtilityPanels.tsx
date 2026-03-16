import { lazy, Suspense } from 'react';
import { TabsContent } from '@/components/ui/tabs';
import { PanelErrorBoundary } from '../PanelErrorBoundary';
import { PanelSkeleton } from '../PanelSkeleton';
import { Cat, CatSpecializationData, Achievement } from '@/types/game';
import { CatRelationship } from '@/types/relationships';
import { LegacyCat, checkRetirementEligibility } from '@/types/legacy';
import { checkSpecializationEligibility } from '@/types/specializations';
import type { BattlePassReward } from '@/types/battlePass';

// Lazy load panels for performance
const HallOfFamePanel = lazy(() =>
  import('../HallOfFamePanel').then((m) => ({ default: m.HallOfFamePanel }))
);
const SpecializationPanel = lazy(() =>
  import('../SpecializationPanel').then((m) => ({ default: m.SpecializationPanel }))
);
const BattlePassPanel = lazy(() =>
  import('../BattlePassPanel').then((m) => ({ default: m.BattlePassPanel }))
);
const AchievementsPanel = lazy(() =>
  import('../AchievementsPanel').then((m) => ({ default: m.AchievementsPanel }))
);
const GraphicsSettingsPanel = lazy(() =>
  import('../GraphicsSettingsPanel').then((m) => ({ default: m.GraphicsSettingsPanel }))
);
const SaveLoadPanel = lazy(() =>
  import('../SaveLoadPanel').then((m) => ({ default: m.SaveLoadPanel }))
);

/**
 * Legacy/Hall of Fame props grouped together
 */
interface LegacyProps {
  retiredCats: LegacyCat[];
  totalLegacyBonus: number;
  onRetireCat: (cat: Cat) => void;
  canRetire: (cat: Cat) => boolean;
  getEligibility: (cat: Cat) => ReturnType<typeof checkRetirementEligibility>;
  getKittenBonuses: () => {
    gradeBonus: number;
    healthBonus: number;
    trainingBonus: number;
    relationshipBonus: number;
  };
}

/**
 * Specialization props grouped together
 */
interface SpecializationProps {
  kittensBred: number;
  onSpecialize: (catId: string, specializationId: string) => void;
  canSpecialize: (
    cat: Cat,
    friendshipCount: number,
    kittenCount: number
  ) => ReturnType<typeof checkSpecializationEligibility>;
  getSpecialization: (cat: Cat) => CatSpecializationData | undefined;
  getActiveBonuses: () => {
    showScoreBonus: number;
    showMoneyBonus: number;
    relationshipBonus: number;
    kittenGradeBonus: number;
    kittenHealthBonus: number;
    breedingSuccessBonus: number;
  };
}

/**
 * Battle pass props grouped together
 */
interface BattlePassProps {
  money: number;
  onClaimReward: (reward: BattlePassReward) => void;
  onUpgradePremium: () => void;
}

/**
 * Achievement stats needed for panel
 */
interface AchievementStats {
  cats: number;
  showWins: number;
  money: number;
  breeding: number;
  house: boolean;
  farm: boolean;
  acres: number;
  challengesCompleted: number;
}

/**
 * Save/Load props grouped together
 */
interface SaveLoadProps {
  isLoggedIn: boolean;
  cloudSyncing: boolean;
  lastCloudSave: string | null;
  onSave: () => void;
  onLoad: () => void;
  hasSave: boolean;
  lastSaveDay: number;
}

interface UtilityPanelsProps {
  /** Cat data */
  cats: Cat[];
  catCostumes: Record<string, string>;
  relationships: CatRelationship[];
  achievements: Achievement[];
  /** Legacy/Hall of Fame data and handlers */
  legacy: LegacyProps;
  /** Specialization data and handlers */
  specialization: SpecializationProps;
  /** Battle pass handlers */
  battlePass: BattlePassProps;
  /** Achievement stats */
  stats: AchievementStats;
  /** Save/Load data and handlers */
  saveLoad: SaveLoadProps;
}

/**
 * Utility and settings panels: Legacy, Specializations, Battle Pass, Achievements, Settings, Save/Load
 * Uses React.lazy for code splitting and improved initial load performance.
 */
export function UtilityPanels({
  cats,
  catCostumes,
  relationships,
  achievements,
  legacy,
  specialization,
  battlePass,
  stats,
  saveLoad,
}: UtilityPanelsProps) {
  return (
    <>
      <TabsContent value="legacy" className="mt-0 panel-animate-in">
        <PanelErrorBoundary panelName="HallOfFamePanel">
          <Suspense fallback={<PanelSkeleton rows={4} />}>
            <HallOfFamePanel
              cats={cats}
              retiredCats={legacy.retiredCats}
              totalLegacyBonus={legacy.totalLegacyBonus}
              catCostumes={catCostumes}
              onRetireCat={legacy.onRetireCat}
              canRetire={legacy.canRetire}
              getEligibility={legacy.getEligibility}
              getKittenBonuses={legacy.getKittenBonuses}
            />
          </Suspense>
        </PanelErrorBoundary>
      </TabsContent>
      <TabsContent value="specializations" className="mt-0 panel-animate-in">
        <PanelErrorBoundary panelName="SpecializationPanel">
          <Suspense fallback={<PanelSkeleton rows={4} />}>
            <SpecializationPanel
              cats={cats}
              catCostumes={catCostumes}
              relationships={relationships}
              kittensBred={specialization.kittensBred}
              onSpecialize={specialization.onSpecialize}
              canSpecialize={specialization.canSpecialize}
              getSpecialization={specialization.getSpecialization}
              getActiveBonuses={specialization.getActiveBonuses}
            />
          </Suspense>
        </PanelErrorBoundary>
      </TabsContent>
      <TabsContent value="battlepass" className="mt-0 panel-animate-in">
        <PanelErrorBoundary panelName="BattlePassPanel">
          <Suspense fallback={<PanelSkeleton rows={5} />}>
            <BattlePassPanel
              money={battlePass.money}
              onClaimReward={battlePass.onClaimReward}
              onUpgradePremium={battlePass.onUpgradePremium}
            />
          </Suspense>
        </PanelErrorBoundary>
      </TabsContent>
      <TabsContent value="more" className="mt-0 space-y-4">
        <PanelErrorBoundary panelName="MorePanels">
          <Suspense fallback={<PanelSkeleton rows={3} />}>
            <AchievementsPanel achievements={achievements} currentStats={stats} />
          </Suspense>
          <Suspense fallback={<PanelSkeleton rows={2} showHeader={false} />}>
            <GraphicsSettingsPanel />
          </Suspense>
          <Suspense fallback={<PanelSkeleton rows={2} showHeader={false} />}>
            <SaveLoadPanel
              onSave={saveLoad.onSave}
              onLoad={saveLoad.onLoad}
              hasSave={saveLoad.hasSave}
              lastSaveDay={saveLoad.lastSaveDay}
              isLoggedIn={saveLoad.isLoggedIn}
              cloudSyncing={saveLoad.cloudSyncing}
              lastCloudSave={saveLoad.lastCloudSave}
            />
          </Suspense>
        </PanelErrorBoundary>
      </TabsContent>
    </>
  );
}

// Re-export types for external use
export type {
  UtilityPanelsProps,
  LegacyProps,
  SpecializationProps,
  BattlePassProps,
  AchievementStats,
  SaveLoadProps,
};
