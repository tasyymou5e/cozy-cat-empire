import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAdminActivityLog } from '@/hooks/useAdminActivityLog';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { Coins, Package, Save, AlertTriangle, RotateCcw } from 'lucide-react';

interface PlayerInventoryEditorProps {
  userId: string;
  gameState: any;
  onUpdate: () => void;
}

interface Resources {
  food: number;
  medicine: number;
  toys: number;
  treats: number;
}

export function PlayerInventoryEditor({ userId, gameState, onUpdate }: PlayerInventoryEditorProps) {
  const gameStateData = gameState?.game_state as Record<string, unknown> | null;
  const currentMoney = (gameStateData?.money as number) || 0;
  const currentResources = (gameStateData?.resources as Resources) || { food: 0, medicine: 0, toys: 0, treats: 0 };

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

  const { logActivity } = useAdminActivityLog();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const hasChanges = money !== currentMoney || 
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

      const { error } = await supabase
        .from('game_saves')
        .update({ game_state: updatedGameState as Json })
        .eq('user_id', userId);

      if (error) throw error;

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
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update inventory',
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

      const { error } = await supabase
        .from('game_saves')
        .update({ 
          game_state: resetGameState,
          kittens_bred: 0,
          relationships: [],
        })
        .eq('user_id', userId);

      if (error) throw error;

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
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reset game',
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
                {money > currentMoney ? '+' : ''}{(money - currentMoney).toLocaleString()}
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
                  onChange={(e) => setResources(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                  className="w-20"
                />
                <span className="text-xs text-muted-foreground">
                  ({(currentResources as any)[key] || 0})
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

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
        <Button
          variant="destructive"
          onClick={() => setResetDialogOpen(true)}
          disabled={isSaving}
        >
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
                <span>${currentMoney.toLocaleString()} → ${money.toLocaleString()}</span>
              </div>
            )}
            {Object.entries(resources).map(([key, value]) => {
              const current = (currentResources as any)[key] || 0;
              if (value !== current) {
                return (
                  <div key={key} className="flex justify-between capitalize">
                    <span>{key}:</span>
                    <span>{current} → {value}</span>
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

      {/* Confirm Reset Dialog */}
      <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Reset Player Game
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will completely reset the player's game to initial state. All cats, money, achievements, 
              and progress will be lost. This cannot be undone.
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
