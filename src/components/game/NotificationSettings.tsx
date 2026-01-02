import { Bell, BellOff, TestTube } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { usePushNotifications } from '@/hooks/usePushNotifications';

interface NotificationSettingsProps {
  userId: string | undefined;
}

export function NotificationSettings({ userId }: NotificationSettingsProps) {
  const {
    isSupported,
    isSubscribed,
    permission,
    preferences,
    loading,
    subscribe,
    unsubscribe,
    updatePreferences,
    sendTestNotification
  } = usePushNotifications(userId);

  if (!isSupported) {
    return (
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BellOff className="h-5 w-5 text-muted-foreground" />
            Push Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Push notifications are not supported in this browser.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bell className="h-5 w-5 text-primary" />
            Push Notifications
          </CardTitle>
          {permission === 'denied' && (
            <Badge variant="destructive">Blocked</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {permission === 'denied' ? (
          <p className="text-sm text-muted-foreground">
            Notifications are blocked. Please enable them in your browser settings.
          </p>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div>
                <Label>Enable Notifications</Label>
                <p className="text-xs text-muted-foreground">
                  Receive alerts even when the app is closed
                </p>
              </div>
              <Switch
                checked={isSubscribed}
                onCheckedChange={(checked) => checked ? subscribe() : unsubscribe()}
                disabled={loading}
              />
            </div>

            {isSubscribed && (
              <>
                <div className="border-t border-border/50 pt-4 space-y-3">
                  <p className="text-sm font-medium">Notification Types</p>
                  
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-normal">Friend Requests</Label>
                    <Switch
                      checked={preferences.friend_requests}
                      onCheckedChange={(checked) => 
                        updatePreferences({ friend_requests: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-normal">Cat Gifts</Label>
                    <Switch
                      checked={preferences.gifts}
                      onCheckedChange={(checked) => 
                        updatePreferences({ gifts: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-normal">Trade Offers</Label>
                    <Switch
                      checked={preferences.trades}
                      onCheckedChange={(checked) => 
                        updatePreferences({ trades: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-normal">Leaderboard Rewards</Label>
                    <Switch
                      checked={preferences.rewards}
                      onCheckedChange={(checked) => 
                        updatePreferences({ rewards: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-normal">Challenge Completions</Label>
                    <Switch
                      checked={preferences.challenges}
                      onCheckedChange={(checked) => 
                        updatePreferences({ challenges: checked })
                      }
                    />
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={sendTestNotification}
                  className="w-full mt-2"
                >
                  <TestTube className="h-4 w-4 mr-2" />
                  Send Test Notification
                </Button>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
