/**
 * useGraphicsSettings Hook
 *
 * Provides runtime graphics settings management with localStorage persistence.
 * Allows users to customize visual settings without code changes.
 */

import { useState, useEffect, useCallback } from 'react';
import { GRAPHICS_CONFIG } from '@/config/graphics';

/**
 * Graphics settings that can be changed at runtime
 */
export interface GraphicsSettings {
  enablePortraitPriority: boolean;
  enableAnimations: boolean;
  cardBorderStyle: 'tier' | 'simple' | 'none';
  avatarQuality: 'low' | 'medium' | 'high';
  enableTierGlows: boolean;
  enableSparkles: boolean;
  enableCardFlip: boolean;
  vectorEngine: 'paperjs' | 'simple';
  avatarBreedFeatures: boolean;
  costumeDisplayMode: 'vector' | 'emoji' | 'auto';
  enableReducedMotion: boolean;
  enableCostumeAnimations: boolean;
  enableParticles: boolean;
  showCostumeOnPortrait: boolean;
  // Empire-specific settings
  enableEmpireParallax: boolean;
  enableEmpireParticles: boolean;
  enableTimeOfDayEffects: boolean;
  enableSeasonalDecorations: boolean;
  // Portrait settings
  portraitQuality: 'standard' | 'premium';
  autoPromptOutdated: boolean;
  showOutdatedIndicator: boolean;
}

const STORAGE_KEY = 'cat-farm-graphics-settings';
const SETTINGS_VERSION = 1;

/**
 * Get initial settings from localStorage or defaults
 */
function getInitialSettings(): GraphicsSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.version === SETTINGS_VERSION) {
        return {
          ...getDefaultSettings(),
          ...parsed.settings,
        };
      }
    }
  } catch (e) {
    console.warn('[GraphicsSettings] Failed to load settings:', e);
  }
  return getDefaultSettings();
}

/**
 * Get default settings from GRAPHICS_CONFIG
 */
function getDefaultSettings(): GraphicsSettings {
  return {
    enablePortraitPriority: GRAPHICS_CONFIG.enablePortraitPriority,
    enableAnimations: GRAPHICS_CONFIG.enableAnimations,
    cardBorderStyle: GRAPHICS_CONFIG.cardBorderStyle,
    avatarQuality: GRAPHICS_CONFIG.avatarQuality,
    enableTierGlows: GRAPHICS_CONFIG.enableTierGlows,
    enableSparkles: GRAPHICS_CONFIG.enableSparkles,
    enableCardFlip: GRAPHICS_CONFIG.enableCardFlip,
    vectorEngine: GRAPHICS_CONFIG.vectorEngine,
    avatarBreedFeatures: GRAPHICS_CONFIG.avatarBreedFeatures,
    costumeDisplayMode: GRAPHICS_CONFIG.costumeDisplayMode,
    enableReducedMotion: GRAPHICS_CONFIG.enableReducedMotion,
    enableCostumeAnimations: GRAPHICS_CONFIG.enableCostumeAnimations,
    enableParticles: true,
    showCostumeOnPortrait: GRAPHICS_CONFIG.showCostumeOnPortrait,
    // Empire defaults
    enableEmpireParallax: true,
    enableEmpireParticles: true,
    enableTimeOfDayEffects: true,
    enableSeasonalDecorations: true,
    // Portrait defaults
    portraitQuality: 'standard',
    autoPromptOutdated: true,
    showOutdatedIndicator: true,
  };
}

/**
 * Save settings to localStorage
 */
function saveSettings(settings: GraphicsSettings): void {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: SETTINGS_VERSION,
        settings,
      })
    );
  } catch (e) {
    console.warn('[GraphicsSettings] Failed to save settings:', e);
  }
}

/**
 * Hook for managing graphics settings
 *
 * @example
 * ```tsx
 * function SettingsPanel() {
 *   const { settings, updateSetting, resetToDefaults, isReducedMotion } = useGraphicsSettings();
 *
 *   return (
 *     <Switch
 *       checked={settings.enableAnimations}
 *       onCheckedChange={(v) => updateSetting('enableAnimations', v)}
 *     />
 *   );
 * }
 * ```
 */
export function useGraphicsSettings() {
  const [settings, setSettings] = useState<GraphicsSettings>(getInitialSettings);
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  // Check for prefers-reduced-motion on mount
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setIsReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Update a single setting
  const updateSetting = useCallback(
    <K extends keyof GraphicsSettings>(key: K, value: GraphicsSettings[K]) => {
      setSettings((prev) => {
        const next = { ...prev, [key]: value };
        saveSettings(next);
        return next;
      });
    },
    []
  );

  // Reset all settings to defaults
  const resetToDefaults = useCallback(() => {
    const defaults = getDefaultSettings();
    setSettings(defaults);
    saveSettings(defaults);
  }, []);

  // Get effective animation state (respects reduced motion preference)
  const effectiveAnimations =
    settings.enableAnimations && !isReducedMotion && !settings.enableReducedMotion;

  return {
    settings,
    updateSetting,
    resetToDefaults,
    isReducedMotion,
    effectiveAnimations,
  };
}

export default useGraphicsSettings;
