/**
 * @fileoverview System hooks aggregation for CatFarm component
 * 
 * Combines core system hooks (sound, confetti, haptics, auth, theme)
 * into a single aggregated object.
 * 
 * @module hooks/useCatFarmSystems
 */

import { useSound } from '@/contexts/SoundContext';
import { useConfetti } from '@/hooks/useConfetti';
import { useHaptics } from '@/hooks/useHaptics';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTheme } from 'next-themes';
import { useCatReactions } from '@/contexts/CatReactionContext';

/**
 * Aggregates core system hooks for CatFarm
 * 
 * @returns Combined system hook results
 * 
 * @example
 * ```tsx
 * const systems = useCatFarmSystems();
 * systems.sound.playSound('click');
 * systems.confetti.fireConfetti();
 * ```
 */
export function useCatFarmSystems() {
  const sound = useSound();
  const confetti = useConfetti();
  const haptics = useHaptics();
  const { user, signOut, loading: authLoading } = useAuth();
  const { theme, setTheme } = useTheme();
  const isMobile = useIsMobile();
  const { getCatReaction } = useCatReactions();

  return {
    sound,
    confetti,
    haptics,
    auth: { user, signOut, loading: authLoading },
    theme: { theme, setTheme },
    isMobile,
    getCatReaction,
  };
}

export type CatFarmSystems = ReturnType<typeof useCatFarmSystems>;
