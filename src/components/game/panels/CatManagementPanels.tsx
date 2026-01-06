import { TabsContent } from '@/components/ui/tabs';
import { PanelErrorBoundary } from '../PanelErrorBoundary';
import { ActionPanel } from '../ActionPanel';

interface CatManagementPanelsProps {
  money: number;
  space: number;
  catCount: number;
  onAddCat: (type: 'stray' | 'adopted' | 'pure') => void;
  onNextDay: () => void;
}

/**
 * Cat management panels: Actions (Add Cat, Next Day)
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
        <ActionPanel 
          onAddCat={onAddCat} 
          onNextDay={onNextDay} 
          money={money} 
          space={space} 
          catCount={catCount} 
        />
      </PanelErrorBoundary>
    </TabsContent>
  );
}
