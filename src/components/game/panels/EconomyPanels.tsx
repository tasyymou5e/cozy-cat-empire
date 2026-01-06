import { lazy, Suspense } from 'react';
import { TabsContent } from '@/components/ui/tabs';
import { PanelErrorBoundary } from '../PanelErrorBoundary';
import { PanelSkeleton } from '../PanelSkeleton';
import { Resources, MarketListing } from '@/types/game';
import { GameAction, GameActions, GameActionPayloads } from '@/types/gameEvents';

// Lazy load panels for performance
const ChorePanel = lazy(() => import('../ChorePanel').then(m => ({ default: m.ChorePanel })));
const ResourcePanel = lazy(() => import('../ResourcePanel').then(m => ({ default: m.ResourcePanel })));
const MarketPanel = lazy(() => import('../MarketPanel').then(m => ({ default: m.MarketPanel })));

interface EconomyPanelsProps {
  resources: Resources;
  money: number;
  catCount: number;
  marketListings: MarketListing[];
  hasSpace: boolean;
  dispatchAction: <A extends GameAction>(type: A, payload?: GameActionPayloads[A]) => void;
  onBuyFromMarket: (listingId: string) => void;
}

/**
 * Economy-related panels: Chores, Supplies, Market
 * Uses React.lazy for code splitting and improved initial load performance.
 */
export function EconomyPanels({
  resources,
  money,
  catCount,
  marketListings,
  hasSpace,
  dispatchAction,
  onBuyFromMarket,
}: EconomyPanelsProps) {
  return (
    <>
      <TabsContent value="chores" className="mt-0">
        <PanelErrorBoundary panelName="ChorePanel">
          <Suspense fallback={<PanelSkeleton rows={4} />}>
            <ChorePanel onDoChore={(choreId, baseReward) => dispatchAction(GameActions.DO_CHORE, { choreId, baseReward })} />
          </Suspense>
        </PanelErrorBoundary>
      </TabsContent>
      <TabsContent value="supplies" className="mt-0">
        <PanelErrorBoundary panelName="ResourcePanel">
          <Suspense fallback={<PanelSkeleton rows={4} />}>
            <ResourcePanel 
              resources={resources} 
              money={money} 
              catCount={catCount}
              onBuyResource={(resource, cost) => dispatchAction(GameActions.BUY_RESOURCE, { resource: resource as keyof Resources, cost })} 
              onFeedCats={() => dispatchAction(GameActions.FEED_CATS, undefined)} 
              onUseToys={() => dispatchAction(GameActions.USE_TOYS, undefined)} 
            />
          </Suspense>
        </PanelErrorBoundary>
      </TabsContent>
      <TabsContent value="market" className="mt-0">
        <PanelErrorBoundary panelName="MarketPanel">
          <Suspense fallback={<PanelSkeleton rows={4} />}>
            <MarketPanel 
              listings={marketListings} 
              money={money} 
              hasSpace={hasSpace} 
              onBuy={onBuyFromMarket} 
            />
          </Suspense>
        </PanelErrorBoundary>
      </TabsContent>
    </>
  );
}
