import { TabsContent } from '@/components/ui/tabs';
import { PanelErrorBoundary } from '../PanelErrorBoundary';
import { BreedingPanel } from '../BreedingPanel';
import { TrainingPanel } from '../TrainingPanel';
import { CostumeShopPanel } from '../CostumeShopPanel';
import { Cat } from '@/types/game';
import { CatRelationship } from '@/types/relationships';

interface BreedingTrainingPanelsProps {
  cats: Cat[];
  breedingCooldown: number;
  hasSpace: boolean;
  treats: number;
  toys: number;
  day: number;
  catCostumes: Record<string, string>;
  relationships: CatRelationship[];
  money: number;
  ownedCostumes: string[];
  dispatchAction: (type: string, payload?: Record<string, unknown>) => void;
  getBreedingCompatibility: (cat1Id: string, cat2Id: string) => {
    canBreed: boolean;
    bonus: number;
    message: string;
  };
  onBuyCostume: (costumeId: string) => void;
  onEquipCostume: (catId: string, costumeId: string | null) => void;
  onPortraitOutdated: () => void;
}

/**
 * Breeding and Training related panels: Costumes, Breeding, Training
 */
export function BreedingTrainingPanels({
  cats,
  breedingCooldown,
  hasSpace,
  treats,
  toys,
  day,
  catCostumes,
  relationships,
  money,
  ownedCostumes,
  dispatchAction,
  getBreedingCompatibility,
  onBuyCostume,
  onEquipCostume,
  onPortraitOutdated,
}: BreedingTrainingPanelsProps) {
  return (
    <>
      <TabsContent value="costumes" className="mt-0">
        <PanelErrorBoundary panelName="CostumeShopPanel">
          <CostumeShopPanel 
            cats={cats} 
            money={money} 
            ownedCostumes={ownedCostumes} 
            catCostumes={catCostumes}
            onBuyCostume={onBuyCostume}
            onEquipCostume={onEquipCostume}
            onPortraitOutdated={onPortraitOutdated}
          />
        </PanelErrorBoundary>
      </TabsContent>
      <TabsContent value="breeding" className="mt-0">
        <PanelErrorBoundary panelName="BreedingPanel">
          <BreedingPanel 
            cats={cats} 
            cooldown={breedingCooldown} 
            hasSpace={hasSpace}
            onBreed={(cat1Id, cat2Id) => dispatchAction('BREED_CATS', { cat1Id, cat2Id })} 
            getBreedingCompatibility={getBreedingCompatibility} 
            catCostumes={catCostumes} 
            relationships={relationships} 
          />
        </PanelErrorBoundary>
      </TabsContent>
      <TabsContent value="training" className="mt-0">
        <PanelErrorBoundary panelName="TrainingPanel">
          <TrainingPanel 
            cats={cats} 
            treats={treats} 
            toys={toys}
            day={day} 
            onTrain={(catId, trickId) => dispatchAction('TRAIN_CAT', { catId, trickId })} 
            onRest={(catId) => dispatchAction('REST_CAT', { catId })} 
            catCostumes={catCostumes} 
          />
        </PanelErrorBoundary>
      </TabsContent>
    </>
  );
}
