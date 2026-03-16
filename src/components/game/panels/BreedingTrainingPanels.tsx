import { lazy, Suspense } from 'react';
import { TabsContent } from '@/components/ui/tabs';
import { PanelErrorBoundary } from '../PanelErrorBoundary';
import { PanelSkeleton } from '../PanelSkeleton';
import { Cat } from '@/types/game';
import { CatRelationship } from '@/types/relationships';
import { GameAction, GameActions, GameActionPayloads } from '@/types/gameEvents';

// Lazy load panels for performance
const BreedingPanel = lazy(() =>
  import('../BreedingPanel').then((m) => ({ default: m.BreedingPanel }))
);
const TrainingPanel = lazy(() =>
  import('../TrainingPanel').then((m) => ({ default: m.TrainingPanel }))
);
const CostumeShopPanel = lazy(() =>
  import('../CostumeShopPanel').then((m) => ({ default: m.CostumeShopPanel }))
);

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
  dispatchAction: <A extends GameAction>(type: A, payload?: GameActionPayloads[A]) => void;
  getBreedingCompatibility: (
    cat1Id: string,
    cat2Id: string
  ) => {
    canBreed: boolean;
    bonus: number;
    message: string;
  };
  onBuyCostume: (costumeId: string) => void;
  onEquipCostume: (catId: string, costumeId: string | null) => void;
  onPortraitOutdated?: (cat: Cat) => void;
}

/**
 * Breeding and Training related panels: Costumes, Breeding, Training
 * Uses React.lazy for code splitting and improved initial load performance.
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
      <TabsContent value="costumes" className="mt-0 panel-animate-in">
        <PanelErrorBoundary panelName="CostumeShopPanel">
          <Suspense fallback={<PanelSkeleton rows={4} />}>
            <CostumeShopPanel
              cats={cats}
              money={money}
              ownedCostumes={ownedCostumes}
              catCostumes={catCostumes}
              onBuyCostume={onBuyCostume}
              onEquipCostume={onEquipCostume}
              onPortraitOutdated={onPortraitOutdated}
            />
          </Suspense>
        </PanelErrorBoundary>
      </TabsContent>
      <TabsContent value="breeding" className="mt-0 panel-animate-in">
        <PanelErrorBoundary panelName="BreedingPanel">
          <Suspense fallback={<PanelSkeleton rows={3} />}>
            <BreedingPanel
              cats={cats}
              cooldown={breedingCooldown}
              hasSpace={hasSpace}
              onBreed={(cat1Id, cat2Id) =>
                dispatchAction(GameActions.BREED_CATS, { cat1Id, cat2Id })
              }
              getBreedingCompatibility={getBreedingCompatibility}
              catCostumes={catCostumes}
              relationships={relationships}
            />
          </Suspense>
        </PanelErrorBoundary>
      </TabsContent>
      <TabsContent value="training" className="mt-0 panel-animate-in">
        <PanelErrorBoundary panelName="TrainingPanel">
          <Suspense fallback={<PanelSkeleton rows={4} />}>
            <TrainingPanel
              cats={cats}
              treats={treats}
              toys={toys}
              day={day}
              onTrain={(catId, trickId) =>
                dispatchAction(GameActions.TRAIN_CAT, { catId, trickId })
              }
              onRest={(catId) => dispatchAction(GameActions.REST_CAT, { catId })}
              catCostumes={catCostumes}
            />
          </Suspense>
        </PanelErrorBoundary>
      </TabsContent>
    </>
  );
}
