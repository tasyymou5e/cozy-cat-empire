import { TabsContent } from '@/components/ui/tabs';
import { PanelErrorBoundary } from '../PanelErrorBoundary';
import { HallOfFamePanel } from '../HallOfFamePanel';
import { SpecializationPanel } from '../SpecializationPanel';
import { BattlePassPanel } from '../BattlePassPanel';
import { AchievementsPanel } from '../AchievementsPanel';
import { GraphicsSettingsPanel } from '../GraphicsSettingsPanel';
import { SaveLoadPanel } from '../SaveLoadPanel';
import { Cat, CatSpecializationData, Achievement } from '@/types/game';
import { CatRelationship } from '@/types/relationships';
import { LegacyCat, checkRetirementEligibility } from '@/types/legacy';
import { checkSpecializationEligibility } from '@/types/specializations';
import type { BattlePassReward } from '@/types/battlePass';

interface UtilityPanelsProps {
  cats: Cat[];
  catCostumes: Record<string, string>;
  relationships: CatRelationship[];
  achievements: Achievement[];
  money: number;
  totalMoneyEarned: number;
  totalShowWins: number;
  kittensBreed: number;
  houseSize: string;
  acres: number;
  challengesCompleted: number;
  retiredCats: LegacyCat[];
  totalLegacyBonus: number;
  isLoggedIn: boolean;
  cloudSyncing: boolean;
  lastCloudSave: string | null;
  onRetireCat: (cat: Cat) => void;
  canRetire: (cat: Cat) => boolean;
  getEligibility: (cat: Cat) => ReturnType<typeof checkRetirementEligibility>;
  getKittenBonuses: () => {
    gradeBonus: number;
    healthBonus: number;
    trainingBonus: number;
    relationshipBonus: number;
  };
  onSpecialize: (catId: string, specializationId: string) => void;
  canSpecialize: (cat: Cat, friendshipCount: number, kittenCount: number) => ReturnType<typeof checkSpecializationEligibility>;
  getSpecialization: (cat: Cat) => CatSpecializationData | undefined;
  getActiveBonuses: () => {
    showScoreBonus: number;
    showMoneyBonus: number;
    relationshipBonus: number;
    kittenGradeBonus: number;
    kittenHealthBonus: number;
    breedingSuccessBonus: number;
  };
  onClaimBPReward: (reward: BattlePassReward) => void;
  onUpgradePremium: () => void;
  onSave: () => void;
  onLoad: () => void;
  hasSave: boolean;
  lastSaveDay: number;
}

/**
 * Utility and settings panels: Legacy, Specializations, Battle Pass, Achievements, Settings, Save/Load
 */
export function UtilityPanels({
  cats,
  catCostumes,
  relationships,
  achievements,
  money,
  totalMoneyEarned,
  totalShowWins,
  kittensBreed,
  houseSize,
  acres,
  challengesCompleted,
  retiredCats,
  totalLegacyBonus,
  isLoggedIn,
  cloudSyncing,
  lastCloudSave,
  onRetireCat,
  canRetire,
  getEligibility,
  getKittenBonuses,
  onSpecialize,
  canSpecialize,
  getSpecialization,
  getActiveBonuses,
  onClaimBPReward,
  onUpgradePremium,
  onSave,
  onLoad,
  hasSave,
  lastSaveDay,
}: UtilityPanelsProps) {
  return (
    <>
      <TabsContent value="legacy" className="mt-0">
        <PanelErrorBoundary panelName="HallOfFamePanel">
          <HallOfFamePanel
            cats={cats}
            retiredCats={retiredCats}
            totalLegacyBonus={totalLegacyBonus}
            catCostumes={catCostumes}
            onRetireCat={onRetireCat}
            canRetire={canRetire}
            getEligibility={getEligibility}
            getKittenBonuses={getKittenBonuses}
          />
        </PanelErrorBoundary>
      </TabsContent>
      <TabsContent value="specializations" className="mt-0">
        <PanelErrorBoundary panelName="SpecializationPanel">
          <SpecializationPanel
            cats={cats}
            catCostumes={catCostumes}
            relationships={relationships}
            kittensBred={kittensBreed}
            onSpecialize={onSpecialize}
            canSpecialize={canSpecialize}
            getSpecialization={getSpecialization}
            getActiveBonuses={getActiveBonuses}
          />
        </PanelErrorBoundary>
      </TabsContent>
      <TabsContent value="battlepass" className="mt-0">
        <PanelErrorBoundary panelName="BattlePassPanel">
          <BattlePassPanel
            money={money}
            onClaimReward={onClaimBPReward}
            onUpgradePremium={onUpgradePremium}
          />
        </PanelErrorBoundary>
      </TabsContent>
      <TabsContent value="more" className="mt-0 space-y-4">
        <PanelErrorBoundary panelName="MorePanels">
          <AchievementsPanel 
            achievements={achievements}
            currentStats={{ 
              cats: cats.length, 
              showWins: totalShowWins, 
              money: totalMoneyEarned,
              breeding: kittensBreed, 
              house: houseSize !== 'apartment', 
              farm: houseSize === 'farm', 
              acres, 
              challengesCompleted 
            }} 
          />
          <GraphicsSettingsPanel />
          <SaveLoadPanel 
            onSave={onSave} 
            onLoad={onLoad} 
            hasSave={hasSave} 
            lastSaveDay={lastSaveDay}
            isLoggedIn={isLoggedIn}
            cloudSyncing={cloudSyncing}
            lastCloudSave={lastCloudSave}
          />
        </PanelErrorBoundary>
      </TabsContent>
    </>
  );
}
