/**
 * @fileoverview UI state management for CatFarm component
 *
 * Manages all local UI state including tabs, audio toggles,
 * modals, and transient visual states.
 *
 * @module hooks/useCatFarmUIState
 */

import { useState, useEffect } from 'react';
import { TAB_LABELS } from '@/constants/tabs';

/**
 * UI state hook for CatFarm component
 *
 * @returns All UI state values and setters
 *
 * @example
 * ```tsx
 * const ui = useCatFarmUIState();
 * ui.setSideTab('breeding');
 * ```
 */
export function useCatFarmUIState() {
  // Tab state
  const [sideTab, setSideTab] = useState('actions');
  const [recentTabs, setRecentTabs] = useState<
    Array<{
      tab: string;
      label: string;
      icon: string;
      timestamp: number;
    }>
  >(() => {
    try {
      const saved = localStorage.getItem('cat-farm-recent-tabs');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Audio state
  const [soundOn, setSoundOn] = useState(true);
  const [musicOn, setMusicOn] = useState(false);
  const [sfxVolume, setSfxVolume] = useState(50);
  const [musicVolume, setMusicVolume] = useState(40);
  const [currentMoodLabel, setCurrentMoodLabel] = useState('');

  // Modal/overlay state
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const [showWhatsNew, setShowWhatsNew] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Cloud sync state
  const [cloudSyncing, setCloudSyncing] = useState(false);
  const [lastCloudSave, setLastCloudSave] = useState<string | null>(null);
  const [hasLoadedCloud, setHasLoadedCloud] = useState(false);

  // Misc UI state
  const [lastAchievementCount, setLastAchievementCount] = useState(0);
  const [highlightedTab, setHighlightedTab] = useState<string | null>(null);
  const [quickSocializePair, setQuickSocializePair] = useState<{
    cat1Id: string;
    cat2Id: string;
  } | null>(null);

  // Track recent tabs
  useEffect(() => {
    const tabInfo = TAB_LABELS[sideTab];
    if (!tabInfo) return;

    setRecentTabs((prev) => {
      const filtered = prev.filter((t) => t.tab !== sideTab);
      const updated = [
        { tab: sideTab, label: tabInfo.label, icon: tabInfo.icon, timestamp: Date.now() },
        ...filtered,
      ].slice(0, 4);
      localStorage.setItem('cat-farm-recent-tabs', JSON.stringify(updated));
      return updated;
    });
  }, [sideTab]);

  return {
    // Tab state
    sideTab,
    setSideTab,
    recentTabs,
    setRecentTabs,

    // Audio state
    soundOn,
    setSoundOn,
    musicOn,
    setMusicOn,
    sfxVolume,
    setSfxVolume,
    musicVolume,
    setMusicVolume,
    currentMoodLabel,
    setCurrentMoodLabel,

    // Modal/overlay state
    showShortcutsHelp,
    setShowShortcutsHelp,
    showWhatsNew,
    setShowWhatsNew,
    mobileMenuOpen,
    setMobileMenuOpen,

    // Cloud sync state
    cloudSyncing,
    setCloudSyncing,
    lastCloudSave,
    setLastCloudSave,
    hasLoadedCloud,
    setHasLoadedCloud,

    // Misc UI state
    lastAchievementCount,
    setLastAchievementCount,
    highlightedTab,
    setHighlightedTab,
    quickSocializePair,
    setQuickSocializePair,
  };
}

export type CatFarmUIState = ReturnType<typeof useCatFarmUIState>;
