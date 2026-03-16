import { lazy, Suspense } from 'react';
import { TabsContent } from '@/components/ui/tabs';
import { PanelErrorBoundary } from '../PanelErrorBoundary';
import { PanelSkeleton } from '../PanelSkeleton';
import { Cat } from '@/types/game';

// Lazy load panel
const PrestigePanel = lazy(() =>
  import('../PrestigePanel').then((m) => ({ default: m.PrestigePanel }))
);

interface PrestigePanelsProps {
  cats: Cat[];
  catCostumes: Record<string, string>;
  onPrestigeCat: (catId: string, updates: Partial<Cat>) => void;
  onUnlockCostume?: (costumeId: string) => void;
}

/**
 * Prestige panel for resetting max-grade cats for permanent bonuses
 */
export function PrestigePanels({
  cats,
  catCostumes,
  onPrestigeCat,
  onUnlockCostume,
}: PrestigePanelsProps) {
  return (
    <TabsContent value="prestige" className="mt-0 panel-animate-in">
      <PanelErrorBoundary panelName="PrestigePanel">
        <Suspense fallback={<PanelSkeleton rows={4} />}>
          <PrestigePanel
            cats={cats}
            catCostumes={catCostumes}
            onPrestigeCat={onPrestigeCat}
            onUnlockCostume={onUnlockCostume}
          />
        </Suspense>
      </PanelErrorBoundary>
    </TabsContent>
  );
}

export type { PrestigePanelsProps };
