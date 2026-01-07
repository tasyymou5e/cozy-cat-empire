import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useAdminActivityLog } from '@/hooks/admin';
import { format } from 'date-fns';
import { Sparkles, Plus, Pencil, Trash2, Calendar, Coins, Star } from 'lucide-react';
import { Json } from '@/integrations/supabase/types';

interface BattlePassSeason {
  id: string;
  season_id: string;
  name: string;
  description: string | null;
  starts_at: string;
  ends_at: string;
  tiers: unknown;
  is_active: boolean;
  premium_price: number;
  created_at: string;
}

interface SeasonFormData {
  season_id: string;
  name: string;
  description: string;
  starts_at: string;
  ends_at: string;
  premium_price: number;
  is_active: boolean;
  tiers: { level: number; xp_required: number; free_reward: string; premium_reward: string }[];
}

const defaultFormData: SeasonFormData = {
  season_id: '',
  name: '',
  description: '',
  starts_at: '',
  ends_at: '',
  premium_price: 500,
  is_active: false,
  tiers: [
    { level: 1, xp_required: 0, free_reward: '100 coins', premium_reward: '200 coins' },
    { level: 2, xp_required: 100, free_reward: '5 treats', premium_reward: '10 treats' },
    { level: 3, xp_required: 250, free_reward: '500 coins', premium_reward: '1000 coins' },
  ],
};

export default function AdminBattlePass() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { logActivity } = useAdminActivityLog();

  const [formOpen, setFormOpen] = useState(false);
  const [editingSeason, setEditingSeason] = useState<BattlePassSeason | null>(null);
  const [deletingSeason, setDeletingSeason] = useState<BattlePassSeason | null>(null);
  const [formData, setFormData] = useState<SeasonFormData>(defaultFormData);

  const { data: seasons, isLoading } = useQuery({
    queryKey: ['admin-battle-pass-seasons'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('battle_pass_seasons')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as BattlePassSeason[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: SeasonFormData) => {
      const { error } = await supabase.from('battle_pass_seasons').insert({
        season_id: data.season_id,
        name: data.name,
        description: data.description || null,
        starts_at: data.starts_at,
        ends_at: data.ends_at,
        premium_price: data.premium_price,
        is_active: data.is_active,
        tiers: data.tiers as unknown as Json,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-battle-pass-seasons'] });
      logActivity({
        actionType: 'battle_pass_create',
        actionDescription: `Created battle pass season: ${formData.name}`,
        targetTable: 'battle_pass_seasons',
      });
      toast({ title: 'Season Created' });
      setFormOpen(false);
      setFormData(defaultFormData);
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: SeasonFormData }) => {
      const { error } = await supabase
        .from('battle_pass_seasons')
        .update({
          season_id: data.season_id,
          name: data.name,
          description: data.description || null,
          starts_at: data.starts_at,
          ends_at: data.ends_at,
          premium_price: data.premium_price,
          is_active: data.is_active,
          tiers: data.tiers as unknown as Json,
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-battle-pass-seasons'] });
      logActivity({
        actionType: 'battle_pass_update',
        actionDescription: `Updated battle pass season: ${formData.name}`,
        targetTable: 'battle_pass_seasons',
      });
      toast({ title: 'Season Updated' });
      setEditingSeason(null);
      setFormData(defaultFormData);
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('battle_pass_seasons').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-battle-pass-seasons'] });
      logActivity({
        actionType: 'battle_pass_delete',
        actionDescription: `Deleted battle pass season`,
        targetTable: 'battle_pass_seasons',
      });
      toast({ title: 'Season Deleted' });
      setDeletingSeason(null);
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const handleEdit = (season: BattlePassSeason) => {
    setEditingSeason(season);
    setFormData({
      season_id: season.season_id,
      name: season.name,
      description: season.description || '',
      starts_at: season.starts_at.slice(0, 16), // Format for datetime-local input
      ends_at: season.ends_at.slice(0, 16),
      premium_price: season.premium_price,
      is_active: season.is_active,
      tiers: Array.isArray(season.tiers) ? (season.tiers as SeasonFormData['tiers']) : [],
    });
  };

  const handleSubmit = () => {
    if (editingSeason) {
      updateMutation.mutate({ id: editingSeason.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const addTier = () => {
    const nextLevel = formData.tiers.length + 1;
    const lastXp = formData.tiers[formData.tiers.length - 1]?.xp_required || 0;
    setFormData({
      ...formData,
      tiers: [
        ...formData.tiers,
        { level: nextLevel, xp_required: lastXp + 150, free_reward: '', premium_reward: '' },
      ],
    });
  };

  const removeTier = (index: number) => {
    setFormData({
      ...formData,
      tiers: formData.tiers.filter((_, i) => i !== index),
    });
  };

  const updateTier = (
    index: number,
    field: keyof SeasonFormData['tiers'][0],
    value: string | number
  ) => {
    const newTiers = [...formData.tiers];
    newTiers[index] = { ...newTiers[index], [field]: value };
    setFormData({ ...formData, tiers: newTiers });
  };

  const isDialogOpen = formOpen || !!editingSeason;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-yellow-500" />
              Battle Pass Management
            </h1>
            <p className="text-muted-foreground">
              Create and manage battle pass seasons and tiers.
            </p>
          </div>
          <Button
            onClick={() => {
              setFormData(defaultFormData);
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Season
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Seasons</CardTitle>
            <CardDescription>All battle pass seasons, past and present.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : seasons?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No battle pass seasons yet.</p>
                <Button variant="outline" className="mt-4" onClick={() => setFormOpen(true)}>
                  Create First Season
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Season ID</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Tiers</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {seasons?.map((season) => (
                    <TableRow key={season.id}>
                      <TableCell>
                        {season.is_active ? (
                          <Badge className="bg-green-600">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{season.name}</TableCell>
                      <TableCell className="font-mono text-xs">{season.season_id}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(season.starts_at), 'MMM d')} -{' '}
                          {format(new Date(season.ends_at), 'MMM d')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-yellow-500" />
                          {Array.isArray(season.tiers) ? season.tiers.length : 0}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Coins className="h-3 w-3 text-yellow-500" />
                          {season.premium_price}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(season)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeletingSeason(season)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setFormOpen(false);
            setEditingSeason(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingSeason ? 'Edit Season' : 'Create Season'}</DialogTitle>
            <DialogDescription>
              Configure the battle pass season details and tiers.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="season_id">Season ID</Label>
                <Input
                  id="season_id"
                  placeholder="season_1"
                  value={formData.season_id}
                  onChange={(e) => setFormData({ ...formData, season_id: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="Season 1: Purrfect Beginnings"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Unlock exclusive rewards..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="starts_at">Start Date</Label>
                <Input
                  id="starts_at"
                  type="datetime-local"
                  value={formData.starts_at}
                  onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ends_at">End Date</Label>
                <Input
                  id="ends_at"
                  type="datetime-local"
                  value={formData.ends_at}
                  onChange={(e) => setFormData({ ...formData, ends_at: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="premium_price">Premium Price (coins)</Label>
                <Input
                  id="premium_price"
                  type="number"
                  value={formData.premium_price}
                  onChange={(e) =>
                    setFormData({ ...formData, premium_price: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Tiers</Label>
                <Button variant="outline" size="sm" onClick={addTier}>
                  <Plus className="h-3 w-3 mr-1" />
                  Add Tier
                </Button>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {formData.tiers.map((tier, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-2 border rounded-lg bg-muted/30"
                  >
                    <span className="text-sm font-medium w-8">#{tier.level}</span>
                    <Input
                      type="number"
                      placeholder="XP"
                      className="w-20"
                      value={tier.xp_required}
                      onChange={(e) =>
                        updateTier(index, 'xp_required', parseInt(e.target.value) || 0)
                      }
                    />
                    <Input
                      placeholder="Free reward"
                      className="flex-1"
                      value={tier.free_reward}
                      onChange={(e) => updateTier(index, 'free_reward', e.target.value)}
                    />
                    <Input
                      placeholder="Premium reward"
                      className="flex-1"
                      value={tier.premium_reward}
                      onChange={(e) => updateTier(index, 'premium_reward', e.target.value)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive shrink-0"
                      onClick={() => removeTier(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setFormOpen(false);
                setEditingSeason(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {editingSeason ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deletingSeason}
        onOpenChange={(open) => !open && setDeletingSeason(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Season</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingSeason?.name}"? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => deletingSeason && deleteMutation.mutate(deletingSeason.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
