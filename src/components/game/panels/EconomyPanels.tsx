import { TabsContent } from '@/components/ui/tabs';
import { PanelErrorBoundary } from '../PanelErrorBoundary';
import { ChorePanel } from '../ChorePanel';
import { ResourcePanel } from '../ResourcePanel';
import { MarketPanel } from '../MarketPanel';
import { Resources, MarketListing } from '@/types/game';

interface EconomyPanelsProps {
  resources: Resources;
  money: number;
  catCount: number;
  marketListings: MarketListing[];
  hasSpace: boolean;
  dispatchAction: (type: string, payload?: Record<string, unknown>) => void;
  onBuyFromMarket: (listingId: string) => void;
}

/**
 * Economy-related panels: Chores, Supplies, Market
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
          <ChorePanel onDoChore={(choreId, baseReward) => dispatchAction('DO_CHORE', { choreId, baseReward })} />
        </PanelErrorBoundary>
      </TabsContent>
      <TabsContent value="supplies" className="mt-0">
        <PanelErrorBoundary panelName="ResourcePanel">
          <ResourcePanel 
            resources={resources} 
            money={money} 
            catCount={catCount}
            onBuyResource={(resource, cost) => dispatchAction('BUY_RESOURCE', { resource: resource as keyof Resources, cost })} 
            onFeedCats={() => dispatchAction('FEED_CATS')} 
            onUseToys={() => dispatchAction('USE_TOYS')} 
          />
        </PanelErrorBoundary>
      </TabsContent>
      <TabsContent value="market" className="mt-0">
        <PanelErrorBoundary panelName="MarketPanel">
          <MarketPanel 
            listings={marketListings} 
            money={money} 
            hasSpace={hasSpace} 
            onBuy={onBuyFromMarket} 
          />
        </PanelErrorBoundary>
      </TabsContent>
    </>
  );
}
