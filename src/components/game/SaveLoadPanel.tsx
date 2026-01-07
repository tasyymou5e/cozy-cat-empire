import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Cloud, CloudOff, LogIn } from 'lucide-react';

interface SaveLoadPanelProps {
  onSave: () => void;
  onLoad: () => void;
  hasSave: boolean;
  lastSaveDay?: number;
  isLoggedIn?: boolean;
  cloudSyncing?: boolean;
  lastCloudSave?: string | null;
}

export function SaveLoadPanel({
  onSave,
  onLoad,
  hasSave,
  lastSaveDay,
  isLoggedIn = false,
  cloudSyncing = false,
  lastCloudSave,
}: SaveLoadPanelProps) {
  return (
    <Card className="border-accent/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          {isLoggedIn ? (
            <>
              <Cloud className="h-5 w-5 text-green-500" />
              Cloud Save
            </>
          ) : (
            <>💾 Save / Load</>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoggedIn ? (
          <>
            <Button onClick={onSave} className="w-full" variant="default" disabled={cloudSyncing}>
              {cloudSyncing ? (
                <>
                  <Cloud className="h-4 w-4 mr-2 animate-pulse" />
                  Syncing...
                </>
              ) : (
                <>
                  <Cloud className="h-4 w-4 mr-2" />
                  Save to Cloud
                </>
              )}
            </Button>

            <Button onClick={onLoad} className="w-full" variant="outline">
              📂 Load from Cloud
            </Button>

            {lastCloudSave && (
              <p className="text-xs text-muted-foreground text-center">
                Last sync: {new Date(lastCloudSave).toLocaleString()}
              </p>
            )}

            <p className="text-xs text-green-600 text-center flex items-center justify-center gap-1">
              <Cloud className="h-3 w-3" />
              Progress saves automatically
            </p>
          </>
        ) : (
          <>
            <Button onClick={onSave} className="w-full" variant="outline">
              💾 Save Game (Local)
            </Button>

            <Button onClick={onLoad} className="w-full" variant="outline" disabled={!hasSave}>
              📂 Load Game
            </Button>

            {hasSave && lastSaveDay && (
              <p className="text-xs text-muted-foreground text-center">
                Last save: Day {lastSaveDay}
              </p>
            )}

            {!hasSave && (
              <p className="text-xs text-muted-foreground text-center">No saved game found</p>
            )}

            <div className="pt-2 border-t border-border">
              <Link to="/auth" className="block">
                <Button variant="secondary" className="w-full gap-2">
                  <LogIn className="h-4 w-4" />
                  Log in for Cloud Saves
                </Button>
              </Link>
              <p className="text-xs text-muted-foreground text-center mt-2">
                Save your progress across devices
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
