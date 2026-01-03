import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ChallengeForm } from '@/components/admin/ChallengeForm';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ArrowLeftRight, Gift, Calendar, Users, Plus, Pencil, Trash2 } from 'lucide-react';

export default function AdminModeration() {
  const [activeTab, setActiveTab] = useState('trades');
  const [challengeFormOpen, setChallengeFormOpen] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState<any>(null);
  const [deletingChallenge, setDeletingChallenge] = useState<any>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: trades, isLoading: tradesLoading } = useQuery({
    queryKey: ['admin-trades'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trade_offers')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  const { data: gifts, isLoading: giftsLoading } = useQuery({
    queryKey: ['admin-gifts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cat_gifts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  const { data: challenges, isLoading: challengesLoading, refetch: refetchChallenges } = useQuery({
    queryKey: ['admin-challenges'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('weekly_challenges')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  const { data: friendRequests, isLoading: friendsLoading } = useQuery({
    queryKey: ['admin-friend-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('player_friends')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  const createChallengeMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from('weekly_challenges').insert([{
        name: data.name,
        description: data.description,
        emoji: data.emoji,
        challenge_type: data.challenge_type,
        target_value: data.target_value,
        difficulty: data.difficulty,
        reward_coins: data.reward_coins,
        reward_badge: data.reward_badge || null,
        starts_at: data.starts_at.toISOString(),
        ends_at: data.ends_at.toISOString(),
        is_active: data.is_active,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Challenge Created' });
      queryClient.invalidateQueries({ queryKey: ['admin-challenges'] });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const updateChallengeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { error } = await supabase
        .from('weekly_challenges')
        .update({
          name: data.name,
          description: data.description,
          emoji: data.emoji,
          challenge_type: data.challenge_type,
          target_value: data.target_value,
          difficulty: data.difficulty,
          reward_coins: data.reward_coins,
          reward_badge: data.reward_badge || null,
          starts_at: data.starts_at.toISOString(),
          ends_at: data.ends_at.toISOString(),
          is_active: data.is_active,
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Challenge Updated' });
      queryClient.invalidateQueries({ queryKey: ['admin-challenges'] });
      setEditingChallenge(null);
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deleteChallengeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('weekly_challenges').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Challenge Deleted' });
      queryClient.invalidateQueries({ queryKey: ['admin-challenges'] });
      setDeletingChallenge(null);
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const toggleChallengeActive = async (challenge: any) => {
    try {
      const { error } = await supabase
        .from('weekly_challenges')
        .update({ is_active: !challenge.is_active })
        .eq('id', challenge.id);
      if (error) throw error;
      refetchChallenges();
      toast({ title: challenge.is_active ? 'Challenge Deactivated' : 'Challenge Activated' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
      case 'accepted':
        return <Badge variant="default">Accepted</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'cancelled':
        return <Badge variant="secondary">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return <Badge className="bg-green-600">Easy</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-600">Medium</Badge>;
      case 'hard':
        return <Badge className="bg-orange-600">Hard</Badge>;
      case 'expert':
        return <Badge className="bg-red-600">Expert</Badge>;
      default:
        return <Badge variant="secondary">{difficulty}</Badge>;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Moderation</h1>
          <p className="text-muted-foreground">
            Monitor trades, gifts, and manage challenges
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-none lg:flex">
            <TabsTrigger value="trades" className="flex items-center gap-2">
              <ArrowLeftRight className="h-4 w-4" />
              <span className="hidden sm:inline">Trades</span>
            </TabsTrigger>
            <TabsTrigger value="gifts" className="flex items-center gap-2">
              <Gift className="h-4 w-4" />
              <span className="hidden sm:inline">Gifts</span>
            </TabsTrigger>
            <TabsTrigger value="challenges" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Challenges</span>
            </TabsTrigger>
            <TabsTrigger value="friends" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Friends</span>
            </TabsTrigger>
          </TabsList>

          {/* Trades Tab */}
          <TabsContent value="trades">
            <Card>
              <CardHeader>
                <CardTitle>Recent Trades ({trades?.length ?? 0})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Status</TableHead>
                        <TableHead>Sender</TableHead>
                        <TableHead>Recipient</TableHead>
                        <TableHead>Offered</TableHead>
                        <TableHead>Requested</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tradesLoading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                          <TableRow key={i}>
                            {Array.from({ length: 6 }).map((_, j) => (
                              <TableCell key={j}>
                                <Skeleton className="h-6 w-16" />
                              </TableCell>
                            ))}
                          </TableRow>
                        ))
                      ) : trades?.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                            No trades found
                          </TableCell>
                        </TableRow>
                      ) : (
                        trades?.map((trade) => (
                          <TableRow key={trade.id}>
                            <TableCell>{getStatusBadge(trade.status || 'pending')}</TableCell>
                            <TableCell className="font-mono text-xs">
                              {trade.sender_id?.slice(0, 8)}...
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {trade.recipient_id?.slice(0, 8)}...
                            </TableCell>
                            <TableCell>
                              {trade.offered_money ? `$${trade.offered_money}` : '-'}
                              {(trade.offered_cats as any[])?.length
                                ? ` + ${(trade.offered_cats as any[]).length} cats`
                                : ''}
                            </TableCell>
                            <TableCell>
                              {trade.requested_money ? `$${trade.requested_money}` : '-'}
                              {(trade.requested_cats as any[])?.length
                                ? ` + ${(trade.requested_cats as any[]).length} cats`
                                : ''}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {trade.created_at
                                ? format(new Date(trade.created_at), 'MMM d, HH:mm')
                                : '-'}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Gifts Tab */}
          <TabsContent value="gifts">
            <Card>
              <CardHeader>
                <CardTitle>Recent Gifts ({gifts?.length ?? 0})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Status</TableHead>
                        <TableHead>Sender</TableHead>
                        <TableHead>Recipient</TableHead>
                        <TableHead>Message</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {giftsLoading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                          <TableRow key={i}>
                            {Array.from({ length: 5 }).map((_, j) => (
                              <TableCell key={j}>
                                <Skeleton className="h-6 w-16" />
                              </TableCell>
                            ))}
                          </TableRow>
                        ))
                      ) : gifts?.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            No gifts found
                          </TableCell>
                        </TableRow>
                      ) : (
                        gifts?.map((gift) => (
                          <TableRow key={gift.id}>
                            <TableCell>{getStatusBadge(gift.status || 'pending')}</TableCell>
                            <TableCell className="font-mono text-xs">
                              {gift.sender_id?.slice(0, 8)}...
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {gift.recipient_id?.slice(0, 8)}...
                            </TableCell>
                            <TableCell className="max-w-xs truncate">
                              {gift.message || '-'}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {gift.created_at
                                ? format(new Date(gift.created_at), 'MMM d, HH:mm')
                                : '-'}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Challenges Tab */}
          <TabsContent value="challenges">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Weekly Challenges ({challenges?.length ?? 0})</CardTitle>
                  <Button onClick={() => setChallengeFormOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Challenge
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Active</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Difficulty</TableHead>
                        <TableHead>Target</TableHead>
                        <TableHead>Reward</TableHead>
                        <TableHead>Ends</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {challengesLoading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                          <TableRow key={i}>
                            {Array.from({ length: 8 }).map((_, j) => (
                              <TableCell key={j}>
                                <Skeleton className="h-6 w-16" />
                              </TableCell>
                            ))}
                          </TableRow>
                        ))
                      ) : challenges?.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                            No challenges found
                          </TableCell>
                        </TableRow>
                      ) : (
                        challenges?.map((challenge) => (
                          <TableRow key={challenge.id}>
                            <TableCell>
                              <Switch
                                checked={challenge.is_active}
                                onCheckedChange={() => toggleChallengeActive(challenge)}
                              />
                            </TableCell>
                            <TableCell>
                              <span className="mr-2">{challenge.emoji}</span>
                              {challenge.name}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {challenge.challenge_type}
                            </TableCell>
                            <TableCell>{getDifficultyBadge(challenge.difficulty || 'medium')}</TableCell>
                            <TableCell>{challenge.target_value}</TableCell>
                            <TableCell>🪙 {challenge.reward_coins}</TableCell>
                            <TableCell className="text-muted-foreground">
                              {challenge.ends_at
                                ? format(new Date(challenge.ends_at), 'MMM d')
                                : '-'}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setEditingChallenge(challenge)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => setDeletingChallenge(challenge)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Friends Tab */}
          <TabsContent value="friends">
            <Card>
              <CardHeader>
                <CardTitle>Friend Requests ({friendRequests?.length ?? 0})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Status</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Friend</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {friendsLoading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                          <TableRow key={i}>
                            {Array.from({ length: 4 }).map((_, j) => (
                              <TableCell key={j}>
                                <Skeleton className="h-6 w-16" />
                              </TableCell>
                            ))}
                          </TableRow>
                        ))
                      ) : friendRequests?.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                            No friend requests found
                          </TableCell>
                        </TableRow>
                      ) : (
                        friendRequests?.map((request) => (
                          <TableRow key={request.id}>
                            <TableCell>{getStatusBadge(request.status || 'pending')}</TableCell>
                            <TableCell className="font-mono text-xs">
                              {request.user_id?.slice(0, 8)}...
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {request.friend_id?.slice(0, 8)}...
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {request.created_at
                                ? format(new Date(request.created_at), 'MMM d, HH:mm')
                                : '-'}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Challenge Form */}
      <ChallengeForm
        open={challengeFormOpen}
        onOpenChange={setChallengeFormOpen}
        onSubmit={async (data) => {
          await createChallengeMutation.mutateAsync(data);
        }}
      />

      {/* Edit Challenge Form */}
      {editingChallenge && (
        <ChallengeForm
          open={!!editingChallenge}
          onOpenChange={(open) => !open && setEditingChallenge(null)}
          onSubmit={async (data) => {
            await updateChallengeMutation.mutateAsync({ id: editingChallenge.id, data });
          }}
          initialData={{
            ...editingChallenge,
            starts_at: new Date(editingChallenge.starts_at),
            ends_at: new Date(editingChallenge.ends_at),
          }}
          isEditing
        />
      )}

      {/* Delete Challenge Dialog */}
      <AlertDialog open={!!deletingChallenge} onOpenChange={(open) => !open && setDeletingChallenge(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Challenge</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingChallenge?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteChallengeMutation.mutate(deletingChallenge?.id)}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
