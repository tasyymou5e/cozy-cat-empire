import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { createLogger } from '@/lib/logger';

const log = createLogger('PortraitCredits');

export interface PortraitCredits {
  creditsRemaining: number;
  totalPurchased: number;
  totalUsed: number;
  lastPurchaseAt: string | null;
}

export interface PortraitPackageConfig {
  cost: number;
  portraits: number;
}

interface UsePortraitCreditsReturn {
  credits: PortraitCredits | null;
  packageConfig: PortraitPackageConfig;
  isLoading: boolean;
  isPurchasing: boolean;
  purchaseCredits: () => Promise<{ success: boolean; newMoneyBalance?: number }>;
  refetch: () => Promise<void>;
}

const DEFAULT_PACKAGE_CONFIG: PortraitPackageConfig = { cost: 5000, portraits: 3 };

export function usePortraitCredits(): UsePortraitCreditsReturn {
  const { user } = useAuth();
  const { toast } = useToast();
  const [credits, setCredits] = useState<PortraitCredits | null>(null);
  const [packageConfig, setPackageConfig] = useState<PortraitPackageConfig>(DEFAULT_PACKAGE_CONFIG);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);

  const fetchCredits = useCallback(async () => {
    if (!user) { setCredits(null); setIsLoading(false); return; }
    try {
      const { data, error } = await supabase.functions.invoke('manage-portrait-credits', { method: 'GET' });
      if (error) { log.error('Error fetching portrait credits:', error); setCredits({ creditsRemaining: 0, totalPurchased: 0, totalUsed: 0, lastPurchaseAt: null }); }
      else setCredits(data);
    } catch (err) {
      log.error('Failed to fetch portrait credits:', err);
      setCredits({ creditsRemaining: 0, totalPurchased: 0, totalUsed: 0, lastPurchaseAt: null });
    } finally { setIsLoading(false); }
  }, [user]);

  const fetchPackageConfig = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('game_config').select('value').eq('key', 'portrait_package').single();
      if (!error && data?.value) {
        const config = data.value as unknown as PortraitPackageConfig;
        setPackageConfig({ cost: config.cost || DEFAULT_PACKAGE_CONFIG.cost, portraits: config.portraits || DEFAULT_PACKAGE_CONFIG.portraits });
      }
    } catch (err) { log.error('Failed to fetch package config:', err); }
  }, []);

  useEffect(() => { fetchCredits(); fetchPackageConfig(); }, [fetchCredits, fetchPackageConfig]);

  const purchaseCredits = useCallback(async (): Promise<{ success: boolean; newMoneyBalance?: number }> => {
    if (!user) { toast({ title: 'Login Required', description: 'Please login to purchase portrait credits.', variant: 'destructive' }); return { success: false }; }
    setIsPurchasing(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-portrait-credits', { body: { action: 'purchase' } });
      if (error) { log.error('Purchase error:', error); toast({ title: 'Purchase Failed', description: error.message || 'Failed to purchase portrait credits.', variant: 'destructive' }); return { success: false }; }
      if (data.error) { toast({ title: 'Purchase Failed', description: data.error, variant: 'destructive' }); return { success: false }; }
      setCredits({ creditsRemaining: data.creditsRemaining, totalPurchased: data.totalPurchased, totalUsed: data.totalUsed, lastPurchaseAt: new Date().toISOString() });
      toast({ title: '🎨 Credits Purchased!', description: `You now have ${data.creditsRemaining} portrait credits.` });
      return { success: true, newMoneyBalance: data.newMoneyBalance };
    } catch (err) { log.error('Purchase failed:', err); toast({ title: 'Purchase Failed', description: 'An unexpected error occurred.', variant: 'destructive' }); return { success: false }; }
    finally { setIsPurchasing(false); }
  }, [user, toast]);

  const refetch = useCallback(async () => { await fetchCredits(); }, [fetchCredits]);

  return { credits, packageConfig, isLoading, isPurchasing, purchaseCredits, refetch };
}