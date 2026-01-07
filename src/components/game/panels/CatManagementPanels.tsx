import { lazy, Suspense } from 'react';
import { TabsContent } from '@/components/ui/tabs';
import { PanelErrorBoundary } from '../PanelErrorBoundary';
import { PanelSkeleton } from '../PanelSkeleton';

// Lazy load panels for performance
const ActionPanel = lazy(() => import('../ActionPanel').then((m) => ({ default: m.ActionPanel })));

interface CatManagementPanelsProps {
  money: number;
  space: number;
  catCount: number;
  onAddCat: (type: 'stray' | 'adopted' | 'pure') => void;
  onNextDay: () => void;
}

/**
 * Cat management panels: Actions (Add Cat, Next Day)
 * Uses React.lazy for code splitting and improved initial load performance.
 */
export function CatManagementPanels({
  money,
  space,
  catCount,
  onAddCat,
  onNextDay,
}: CatManagementPanelsProps) {
  return (
    <TabsContent value="actions" className="mt-0">
      <PanelErrorBoundary panelName="ActionPanel">
        <Suspense fallback={<PanelSkeleton rows={2} />}>
          <ActionPanel
            onAddCat={onAddCat}
            onNextDay={onNextDay}
            money={money}
            space={space}
            catCount={catCount}
          />
        </Suspense>
      </PanelErrorBoundary>
    </TabsContent>
  );
}
