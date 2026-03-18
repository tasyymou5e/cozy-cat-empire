import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Cat, HouseSize, GameState } from '@/types/game';
import { TimeOfDay } from '@/types/empire';
import { RealSeason } from '@/lib/seasonUtils';

/** Cost in coins for empire render */
export const EMPIRE_RENDER_COST = 20000;

interface UseEmpireRenderOptions {
  cats: Cat[];
  houseSize: HouseSize;
  catCostumes: Record<string, string>;
  gameDay: number;
  currentMoney: number;
  onSuccess: (renderUrl: string) => void;
  onDeductMoney: (amount: number) => void;
}

interface RenderState {
  isRendering: boolean;
  error: string | null;
  lastRenderUrl: string | null;
}

/**
 * Hook for managing Empire AI rendering
 * Handles the full flow: validation, payment, API call, and state updates
 */
export function useEmpireRender({
  cats,
  houseSize,
  catCostumes,
  gameDay,
  currentMoney,
  onSuccess,
  onDeductMoney,
}: UseEmpireRenderOptions) {
  const { toast } = useToast();
  const [state, setState] = useState<RenderState>({
    isRendering: false,
    error: null,
    lastRenderUrl: null,
  });

  const canAfford = currentMoney >= EMPIRE_RENDER_COST;

  const renderEmpire = useCallback(async (
    timeOfDay: TimeOfDay,
    season: RealSeason,
    customPrompt?: string
  ): Promise<boolean> => {
    // Validate funds
    if (!canAfford) {
      toast({
        title: 'Insufficient Funds',
        description: `You need ${EMPIRE_RENDER_COST.toLocaleString()} coins. You have ${currentMoney.toLocaleString()}.`,
        variant: 'destructive',
      });
      return false;
    }

    setState(prev => ({ ...prev, isRendering: true, error: null }));

    try {
      // Get auth session for the request
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('You must be logged in to render your empire');
      }

      // Prepare cat data (strip unnecessary fields for prompt)
      const catData = cats.map(cat => ({
        id: cat.id,
        name: cat.name,
        breed: cat.breed,
        personality: cat.personality,
        appearance: cat.appearance,
        portraitUrl: cat.portraitUrl,
      }));

      // Call the edge function
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-empire-scene`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            houseSize,
            timeOfDay,
            season,
            cats: catData,
            catCostumes,
            gameDay,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 429) {
          throw new Error('AI rate limit reached. Please try again in a few minutes.');
        }
        if (response.status === 402) {
          throw new Error('AI credits exhausted. Please try again later.');
        }
        
        throw new Error(errorData.error || 'Failed to generate empire scene');
      }

      const data = await response.json();

      if (!data.success || !data.empireRenderUrl) {
        throw new Error(data.error || 'No image generated');
      }

      // Deduct the cost
      onDeductMoney(EMPIRE_RENDER_COST);

      // Update state with the new render URL
      setState(prev => ({
        ...prev,
        isRendering: false,
        lastRenderUrl: data.empireRenderUrl,
      }));

      // Notify parent component
      onSuccess(data.empireRenderUrl);

      toast({
        title: '🎨 Empire Rendered!',
        description: `Your cat empire has been beautifully rendered. ${EMPIRE_RENDER_COST.toLocaleString()} coins spent.`,
      });

      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to render empire';
      
      setState(prev => ({
        ...prev,
        isRendering: false,
        error: message,
      }));

      toast({
        title: 'Render Failed',
        description: message,
        variant: 'destructive',
      });

      return false;
    }
  }, [canAfford, cats, houseSize, catCostumes, gameDay, currentMoney, onSuccess, onDeductMoney, toast]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    canAfford,
    cost: EMPIRE_RENDER_COST,
    renderEmpire,
    clearError,
  };
}
