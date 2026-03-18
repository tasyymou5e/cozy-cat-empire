/**
 * usePortraitStyle Hook
 *
 * Manages per-cat and global portrait style (realistic/kawaii).
 * Reads from cat's portraitStyle field, falls back to global setting.
 */

import { useState, useCallback } from 'react';
import { Cat } from '@/types/game';
import {
  PortraitStyle,
  getGlobalPortraitStyle,
  setGlobalPortraitStyle,
  getEffectivePortraitStyle,
} from '@/config/portraitSettings';

export function usePortraitStyle() {
  const [globalDefault, setGlobalDefaultState] = useState<PortraitStyle>(getGlobalPortraitStyle);

  /**
   * Get the effective portrait style for a given cat
   */
  const getStyleForCat = useCallback(
    (cat: Cat): PortraitStyle => {
      return getEffectivePortraitStyle(cat.portraitStyle, globalDefault);
    },
    [globalDefault]
  );

  /**
   * Update the global default portrait style
   */
  const setGlobalDefault = useCallback((style: PortraitStyle) => {
    setGlobalPortraitStyle(style);
    setGlobalDefaultState(style);
  }, []);

  return {
    globalDefault,
    getStyleForCat,
    setGlobalDefault,
  };
}

export default usePortraitStyle;
