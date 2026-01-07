import { useState } from 'react';
import { useFriends } from '@/hooks/useFriends';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Users, UserPlus, Bell, Trophy, Cat, Heart, Check, X, Trash2, Search } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Props for the FriendsPanel component
 */
interface FriendsPanelProps {
  /** Current user's ID (undefined if not logged in) */
  userId: string | undefined;
}

/**
 * FriendsPanel - Social friends management interface
 *
 * Allows players to view friends, manage friend requests, and add new friends.
 * Displays friend stats including show wins, cats owned, and kittens bred.
 *
 * @example
 * ```tsx
 * <FriendsPanel userId={user?.id} />
 * ```
 */

export function FriendsPanel({ userId }: FriendsPanelProps) {
  const {
    friends,
    pendingRequests,
    loading,
    sendFriendRequest,
    acceptRequest,
    declineRequest,
    removeFriend,
  } = useFriends(userId);

  const [searchQuery, setSearchQuery] = useState('');
  const [sending, setSending] = useState(false);

  const handleSendRequest = async () => {
    if (!searchQuery.trim()) return;

    setSending(true);
    const result = await sendFriendRequest(searchQuery.trim());
    setSending(false);

    if (result.success) {
      toast.success('Friend request sent!');
      setSearchQuery('');
    } else {
      toast.error(result.error || 'Failed to send request');
    }
  };

  if (!userId) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
          Log in to add friends and see their progress!
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Friends
          {pendingRequests.length > 0 && (
            <Badge variant="destructive" className="ml-auto">
              {pendingRequests.length} new
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="friends">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="friends">
              <Users className="h-4 w-4 mr-1" />
              Friends
            </TabsTrigger>
            <TabsTrigger value="requests" className="relative">
              <Bell className="h-4 w-4 mr-1" />
              Requests
              {pendingRequests.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  {pendingRequests.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="add">
              <UserPlus className="h-4 w-4 mr-1" />
              Add
            </TabsTrigger>
          </TabsList>

          <TabsContent value="friends" className="mt-0">
            {loading ? (
              <div className="text-center py-4 text-muted-foreground">Loading friends...</div>
            ) : friends.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                No friends yet. Add some friends to see their progress!
              </div>
            ) : (
              <div className="space-y-2">
                {friends.map((friend) => (
                  <div
                    key={friend.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                  >
                    <div className="text-2xl">{friend.avatar_emoji}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {friend.display_name || 'Anonymous'}
                      </div>
                      {friend.username && (
                        <div className="text-xs text-muted-foreground">@{friend.username}</div>
                      )}
                      {friend.stats && (
                        <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Trophy className="h-3 w-3" />
                            {friend.stats.total_show_wins}
                          </span>
                          <span className="flex items-center gap-1">
                            <Cat className="h-3 w-3" />
                            {friend.stats.total_cats_owned}
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="h-3 w-3" />
                            {friend.stats.total_kittens_bred}
                          </span>
                        </div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => removeFriend(friend.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="requests" className="mt-0">
            {pendingRequests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                No pending friend requests
              </div>
            ) : (
              <div className="space-y-2">
                {pendingRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                  >
                    <div className="text-2xl">{request.avatar_emoji}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {request.display_name || 'Anonymous'}
                      </div>
                      {request.username && (
                        <div className="text-xs text-muted-foreground">@{request.username}</div>
                      )}
                      <div className="text-xs text-muted-foreground">wants to be your friend</div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="default"
                        size="icon"
                        onClick={() => {
                          acceptRequest(request.id);
                          toast.success('Friend request accepted!');
                        }}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          declineRequest(request.id);
                          toast.info('Friend request declined');
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="add" className="mt-0">
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Enter a player's display name or @username to send a friend request.
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Display name or @username..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendRequest()}
                />
                <Button onClick={handleSendRequest} disabled={sending || !searchQuery.trim()}>
                  {sending ? (
                    <Search className="h-4 w-4 animate-pulse" />
                  ) : (
                    <UserPlus className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <div className="text-xs text-muted-foreground">
                Tip: Set your display name and @username in your profile so friends can find you!
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
