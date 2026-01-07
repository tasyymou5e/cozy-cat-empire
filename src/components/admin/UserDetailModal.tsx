import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import {
  Cat,
  Coins,
  Trophy,
  Gift,
  ArrowLeftRight,
  AlertTriangle,
  Package,
  UserCog,
} from 'lucide-react';
import { PlayerInventoryEditor } from './PlayerInventoryEditor';
import { ProfileEditor } from './ProfileEditor';

interface UserDetailModalProps {
  userId: string | null;
  onClose: () => void;
}

export function UserDetailModal({ userId, onClose }: UserDetailModalProps) {
  const queryClient = useQueryClient();
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['admin-user-detail', userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  const { data: gameState, isLoading: gameLoading } = useQuery({
    queryKey: ['admin-user-game', userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from('game_saves')
        .select('*')
        .eq('user_id', userId)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!userId,
  });

  const { data: playerStats } = useQuery({
    queryKey: ['admin-user-stats', userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from('player_stats')
        .select('*')
        .eq('user_id', userId)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!userId,
  });

  const { data: trades } = useQuery({
    queryKey: ['admin-user-trades', userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from('trade_offers')
        .select('*')
        .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  const { data: gifts } = useQuery({
    queryKey: ['admin-user-gifts', userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from('cat_gifts')
        .select('*')
        .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  const { data: errors } = useQuery({
    queryKey: ['admin-user-errors', userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from('error_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  const isLoading = userLoading || gameLoading;

  // Parse game state to get cats (handle JSONB type)
  const gameStateData = gameState?.game_state as Record<string, unknown> | null;
  const cats = (gameStateData?.cats as unknown[]) || [];
  const money = (gameStateData?.money as number) || 0;
  const resources = (gameStateData?.resources as Record<string, unknown>) || {};

  return (
    <Dialog open={!!userId} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {user?.avatar_emoji || '😺'} {user?.display_name || user?.email || 'User Details'}
            {user?.suspended_at && <Badge variant="destructive">Suspended</Badge>}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="inventory">Inventory</TabsTrigger>
              <TabsTrigger value="profile" className="flex items-center gap-1">
                Profile
                {!user?.display_name && (
                  <Badge variant="destructive" className="h-4 w-4 p-0 text-[10px] rounded-full">
                    !
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="cats">Cats</TabsTrigger>
              <TabsTrigger value="trades">Trades</TabsTrigger>
              <TabsTrigger value="gifts">Gifts</TabsTrigger>
              <TabsTrigger value="errors">Errors</TabsTrigger>
            </TabsList>

            <ScrollArea className="h-[50vh] mt-4">
              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2">
                        <Coins className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm text-muted-foreground">Money</span>
                      </div>
                      <p className="text-2xl font-bold">${money.toLocaleString()}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2">
                        <Cat className="h-4 w-4 text-orange-500" />
                        <span className="text-sm text-muted-foreground">Cats</span>
                      </div>
                      <p className="text-2xl font-bold">{cats.length}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm text-muted-foreground">Wins</span>
                      </div>
                      <p className="text-2xl font-bold">{playerStats?.total_show_wins || 0}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2">
                        <Gift className="h-4 w-4 text-pink-500" />
                        <span className="text-sm text-muted-foreground">Kittens</span>
                      </div>
                      <p className="text-2xl font-bold">{gameState?.kittens_bred || 0}</p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Account Info</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Email</span>
                      <span>{user?.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Username</span>
                      <span>{user?.username || 'Not set'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Created</span>
                      <span>
                        {user?.created_at ? format(new Date(user.created_at), 'PPP') : 'Unknown'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Last Played</span>
                      <span>
                        {gameState?.last_played_at
                          ? format(new Date(gameState.last_played_at), 'PPP')
                          : 'Never'}
                      </span>
                    </div>
                    {user?.suspended_at && (
                      <>
                        <div className="flex justify-between text-destructive">
                          <span>Suspended At</span>
                          <span>{format(new Date(user.suspended_at), 'PPP')}</span>
                        </div>
                        <div className="flex justify-between text-destructive">
                          <span>Reason</span>
                          <span>{user.suspension_reason || 'No reason given'}</span>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                {Object.keys(resources).length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Resources</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(resources).map(([key, value]) => (
                          <Badge key={key} variant="secondary">
                            {key}: {String(value)}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="inventory" className="space-y-4">
                {gameState ? (
                  <PlayerInventoryEditor
                    userId={userId!}
                    gameState={gameState}
                    onUpdate={() => {
                      queryClient.invalidateQueries({ queryKey: ['admin-user-game', userId] });
                    }}
                  />
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No game save found for this user</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="profile" className="space-y-4">
                {user && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <UserCog className="h-4 w-4" />
                        Edit User Profile
                        {!user.display_name && (
                          <Badge variant="destructive">Missing Display Name</Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ProfileEditor
                        userId={userId!}
                        currentDisplayName={user.display_name}
                        currentAvatarEmoji={user.avatar_emoji}
                        currentUsername={user.username}
                        onSave={() => {
                          queryClient.invalidateQueries({
                            queryKey: ['admin-user-detail', userId],
                          });
                          queryClient.invalidateQueries({ queryKey: ['admin-users'] });
                        }}
                      />
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="cats" className="space-y-2">
                {cats.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No cats yet</p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {cats.map((cat: any, index: number) => (
                      <Card key={cat.id || index}>
                        <CardContent className="pt-4">
                          <p className="font-medium">{cat.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Grade: {cat.grade || 'Unknown'}
                          </p>
                          <p className="text-sm text-muted-foreground">Age: {cat.age || 0} days</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="trades" className="space-y-2">
                {!trades || trades.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No trades</p>
                ) : (
                  trades.map((trade) => (
                    <Card key={trade.id}>
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <ArrowLeftRight className="h-4 w-4" />
                            <span className="text-sm">
                              {trade.sender_id === userId ? 'Sent' : 'Received'}
                            </span>
                          </div>
                          <Badge>{trade.status}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {format(new Date(trade.created_at), 'PPp')}
                        </p>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              <TabsContent value="gifts" className="space-y-2">
                {!gifts || gifts.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No gifts</p>
                ) : (
                  gifts.map((gift) => (
                    <Card key={gift.id}>
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Gift className="h-4 w-4 text-pink-500" />
                            <span className="text-sm">
                              {gift.sender_id === userId ? 'Sent' : 'Received'}
                            </span>
                          </div>
                          <Badge>{gift.status}</Badge>
                        </div>
                        {gift.message && (
                          <p className="text-sm text-muted-foreground mt-1">"{gift.message}"</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(gift.created_at), 'PPp')}
                        </p>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              <TabsContent value="errors" className="space-y-2">
                {!errors || errors.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No errors logged</p>
                ) : (
                  errors.map((error) => (
                    <Card key={error.id}>
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-destructive" />
                          <span className="text-sm font-medium">{error.error_type}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{error.error_message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(error.created_at), 'PPp')}
                        </p>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>
            </ScrollArea>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
