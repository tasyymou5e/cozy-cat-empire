import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SaveLoadPanelProps {
  onSave: () => void;
  onLoad: () => void;
  hasSave: boolean;
  lastSaveDay?: number;
}

export function SaveLoadPanel({ onSave, onLoad, hasSave, lastSaveDay }: SaveLoadPanelProps) {
  return (
    <Card className="border-accent/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          💾 Save / Load
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button onClick={onSave} className="w-full" variant="outline">
          💾 Save Game
        </Button>
        
        <Button 
          onClick={onLoad} 
          className="w-full" 
          variant="outline"
          disabled={!hasSave}
        >
          📂 Load Game
        </Button>
        
        {hasSave && lastSaveDay && (
          <p className="text-xs text-muted-foreground text-center">
            Last save: Day {lastSaveDay}
          </p>
        )}
        
        {!hasSave && (
          <p className="text-xs text-muted-foreground text-center">
            No saved game found
          </p>
        )}
      </CardContent>
    </Card>
  );
}
