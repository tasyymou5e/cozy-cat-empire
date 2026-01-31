import { useState, useEffect } from 'react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAdminActivityLog } from '@/hooks/admin';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { Json } from '@/integrations/supabase/types';
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
  Coins,
  Package,
  Save,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Plus,
  Minus,
} from 'lucide-react';

interface GameSave {
  id: string;
  user_id: string;
  game_state: Json;
  kittens_bred: number | null;
  relationships: Json | null;
  last_played_at: string | null;
  created_at: string | null;
}

interface PlayerInventoryEditorProps {
  userId: string;
  gameState: GameSave;
  onUpdate: () => void;
}

interface Resources {
  food: number;
  medicine: number;
  toys: number;
  treats: number;
}

interface PortraitCredits {
  id: string;
  user_id: string;
  credits_remaining: number;
  total_purchased: number;
  total_used: number;
  last_purchase_at: string | null;
}

export function PlayerInventoryEditor({ userId, gameState, onUpdate }: PlayerInventoryEditorProps) {
  const gameStateData = gameState?.game_state as Record<string, unknown> | null;
  const currentMoney = (gameStateData?.money as number) || 0;
  const currentResources = (gameStateData?.resources as Resources) || {
    food: 0,
    medicine: 0,
    toys: 0,
    treats: 0,
  };

  const [money, setMoney] = useState(currentMoney);
  const [resources, setResources] = useState<Resources>({
    food: currentResources.food || 0,
    medicine: currentResources.medicine || 0,
    toys: currentResources.toys || 0,
    treats: currentResources.treats || 0,
  });
  const [reason, setReason] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  // Portrait credits state
  const [portraitCredits, setPortraitCredits] = useState(0);
  const [creditsChange, setCreditsChange] = useState(0);
  const [creditsDialogOpen, setCreditsDialogOpen] = useState(false);

  const { logActivity } = useAdminActivityLog();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch portrait credits for this user
  const { data: creditsData, refetch: refetchCredits } = useQuery({
    queryKey: ['admin-portrait-credits', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('player_portrait_credits')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      return data as PortraitCredits | null;
    },
  });

  useEffect(() => {
    if (creditsData) {
      setPortraitCredits(creditsData.credits_remaining);
    } else {
      setPortraitCredits(0);
    }
  }, [creditsData]);

  const hasChanges =
    money !== currentMoney ||
    resources.food !== (currentResources.food || 0) ||
    resources.medicine !== (currentResources.medicine || 0) ||
    resources.toys !== (currentResources.toys || 0) ||
    resources.treats !== (currentResources.treats || 0);

  const handleSave = async () => {
    if (!reason.trim()) {
      toast({
        title: 'Reason Required',
        description: 'Please provide a reason for modifying the inventory.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const updatedGameState = {
        ...gameStateData,
        money,
        resources: resources as unknown as Record<string, number>,
      };

      const { data, error } = await supabase
        .from('game_saves')
        .update({ game_state: updatedGameState as Json })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      if (!data) {
        throw new Error('Update failed - no rows were affected. Check admin permissions.');
      }

      await logActivity({
        actionType: 'inventory_modify',
        actionDescription: `Modified player inventory: ${reason}`,
        targetUserId: userId,
        targetTable: 'game_saves',
        metadata: {
          reason,
          changes: {
            money: { from: currentMoney, to: money },
            resources: { from: JSON.stringify(currentResources), to: JSON.stringify(resources) },
          },
        },
      });

      toast({
        title: 'Inventory Updated',
        description: 'Player inventory has been modified successfully.',
      });

      setReason('');
      setConfirmDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-user-game', userId] });
      onUpdate();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update inventory';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreditsChange = async () => {
    if (!reason.trim()) {
      toast({
        title: 'Reason Required',
        description: 'Please provide a reason for modifying portrait credits.',
        variant: 'destructive',
      });
      return;
    }

    if (creditsChange === 0) {
      toast({
        title: 'No Change',
        description: 'Please specify a credit amount to add or remove.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const newCredits = Math.max(0, portraitCredits + creditsChange);

      if (creditsData) {
        // Update existing record
        const updates: Partial<PortraitCredits> = {
          credits_remaining: newCredits,
          ...(creditsChange > 0 && {
            total_purchased: creditsData.total_purchased + creditsChange,
          }),
        };

        const { error } = await supabase
          .from('player_portrait_credits')
          .update(updates)
          .eq('user_id', userId);

        if (error) throw error;
      } else {
        // Create new record
        const { error } = await supabase.from('player_portrait_credits').insert({
          user_id: userId,
          credits_remaining: newCredits,
          total_purchased: creditsChange > 0 ? creditsChange : 0,
          total_used: 0,
        });

        if (error) throw error;
      }

      await logActivity({
        actionType: 'portrait_credits_modify',
        actionDescription: `${creditsChange > 0 ? 'Granted' : 'Removed'} ${Math.abs(creditsChange)} portrait credits: ${reason}`,
        targetUserId: userId,
        targetTable: 'player_portrait_credits',
        metadata: {
          reason,
          change: creditsChange,
          previousCredits: portraitCredits,
          newCredits,
        },
      });

      toast({
        title: 'Portrait Credits Updated',
        description: `${creditsChange > 0 ? 'Added' : 'Removed'} ${Math.abs(creditsChange)} credits. New balance: ${newCredits}`,
      });

      setCreditsChange(0);
      setReason('');
      setCreditsDialogOpen(false);
      refetchCredits();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update portrait credits';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetGame = async () => {
    if (!reason.trim()) {
      toast({
        title: 'Reason Required',
        description: 'Please provide a reason for resetting the game.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const resetGameState = {
        cats: [],
        money: 100,
        space: 5,
        houseSize: 'apartment',
        acres: 0,
        day: 1,
        resources: { food: 10, medicine: 5, toys: 3, treats: 5 },
        reputation: 0,
        totalShowWins: 0,
        catsAdopted: 0,
        totalMoneyEarned: 0,
        marketListings: [],
        achievements: [],
        breedingCooldown: 0,
        showCooldown: 0,
        ownedCostumes: [],
        catCostumes: {},
      };

      const { data, error } = await supabase
        .from('game_saves')
        .update({
          game_state: resetGameState,
          kittens_bred: 0,
          relationships: [],
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      if (!data) {
        throw new Error('Reset failed - no rows were affected. Check admin permissions.');
      }

      await logActivity({
        actionType: 'game_reset',
        actionDescription: `Reset player game state: ${reason}`,
        targetUserId: userId,
        targetTable: 'game_saves',
        metadata: {
          reason,
          previousStateSnapshot: 'See activity log for details',
        },
      });

      toast({
        title: 'Game Reset',
        description: 'Player game has been reset to initial state.',
      });

      setReason('');
      setResetDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-user-game', userId] });
      onUpdate();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to reset game';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Money Editor */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Coins className="h-4 w-4 text-yellow-500" />
            Money
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Input
              type="number"
              value={money}
              onChange={(e) => setMoney(Number(e.target.value))}
              className="w-32"
            />
            <span className="text-sm text-muted-foreground">
              Current: ${currentMoney.toLocaleString()}
            </span>
            {money !== currentMoney && (
              <Badge variant={money > currentMoney ? 'default' : 'destructive'}>
                {money > currentMoney ? '+' : ''}
                {(money - currentMoney).toLocaleString()}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Resources Editor */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Package className="h-4 w-4 text-blue-500" />
            Resources
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(resources).map(([key, value]) => (
              <div key={key} className="flex items-center gap-2">
                <Label className="w-20 capitalize text-sm">{key}</Label>
                <Input
                  type="number"
                  value={value}
                  onChange={(e) =>
                    setResources((prev) => ({ ...prev, [key]: Number(e.target.value) }))
                  }
                  className="w-20"
                />
                <span className="text-xs text-muted-foreground">
                  ({currentResources[key as keyof Resources] || 0})
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Portrait Credits Editor */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Portrait Credits
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-2xl font-bold">{portraitCredits}</p>
              <p className="text-xs text-muted-foreground">
                Total purchased: {creditsData?.total_purchased || 0} | Used:{' '}
                {creditsData?.total_used || 0}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setCreditsChange(3);
                  setCreditsDialogOpen(true);
                }}
                className="gap-1"
              >
                <Plus className="h-3 w-3" />
                Grant
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setCreditsChange(-1);
                  setCreditsDialogOpen(true);
                }}
                className="gap-1"
                disabled={portraitCredits === 0}
              >
                <Minus className="h-3 w-3" />
                Remove
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Reason Input */}
      <div className="space-y-2">
        <Label htmlFor="reason">Reason for Changes *</Label>
        <Textarea
          id="reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Enter reason for inventory modification (required)"
          className="h-20"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          onClick={() => setConfirmDialogOpen(true)}
          disabled={!hasChanges || isSaving}
          className="flex-1"
        >
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
        <Button variant="destructive" onClick={() => setResetDialogOpen(true)} disabled={isSaving}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset Game
        </Button>
      </div>

      {/* Confirm Save Dialog */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Inventory Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to modify this player's inventory. This action will be logged.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4 space-y-2 text-sm">
            {money !== currentMoney && (
              <div className="flex justify-between">
                <span>Money:</span>
                <span>
                  ${currentMoney.toLocaleString()} → ${money.toLocaleString()}
                </span>
              </div>
            )}
            {Object.entries(resources).map(([key, value]) => {
              const current = currentResources[key as keyof Resources] || 0;
              if (value !== current) {
                return (
                  <div key={key} className="flex justify-between capitalize">
                    <span>{key}:</span>
                    <span>
                      {current} → {value}
                    </span>
                  </div>
                );
              }
              return null;
            })}
            <div className="mt-4 pt-4 border-t">
              <strong>Reason:</strong> {reason}
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Confirm Changes'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Portrait Credits Dialog */}
      <AlertDialog open={creditsDialogOpen} onOpenChange={setCreditsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              {creditsChange > 0 ? 'Grant' : 'Remove'} Portrait Credits
            </AlertDialogTitle>
            <AlertDialogDescription>
              {creditsChange > 0
                ? 'Grant additional portrait credits to this player.'
                : 'Remove portrait credits from this player.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4 space-y-4">
            <div className="flex items-center gap-4">
              <Label>Credits to {creditsChange > 0 ? 'add' : 'remove'}:</Label>
              <Input
                type="number"
                value={Math.abs(creditsChange)}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setCreditsChange(creditsChange > 0 ? val : -val);
                }}
                className="w-24"
                min={1}
              />
            </div>
            <div className="text-sm space-y-1 bg-muted p-3 rounded-lg">
              <div className="flex justify-between">
                <span>Current balance:</span>
                <span className="font-medium">{portraitCredits}</span>
              </div>
              <div className="flex justify-between">
                <span>After change:</span>
                <span className="font-bold text-primary">
                  {Math.max(0, portraitCredits + creditsChange)}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Reason *</Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter reason for credit modification"
                className="h-16"
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCreditsChange(0)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleCreditsChange} disabled={isSaving || !reason.trim()}>
              {isSaving ? 'Saving...' : `${creditsChange > 0 ? 'Grant' : 'Remove'} Credits`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm Reset Dialog */}
      <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Reset Player Game
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will completely reset the player's game to initial state. All cats, money,
              achievements, and progress will be lost. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="reset-reason">Reason for Reset *</Label>
            <Textarea
              id="reset-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason for game reset"
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResetGame}
              disabled={isSaving || !reason.trim()}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isSaving ? 'Resetting...' : 'Reset Game'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
