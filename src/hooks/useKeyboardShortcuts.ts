import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Callback functions for keyboard shortcut actions
 */
interface ShortcutActions {
  onFeed?: () => void;
  onNextDay?: () => void;
  onSave?: () => void;
  onTabChange?: (tab: string) => void;
  onOpenQuickAccess?: () => void;
}

/** Mapping of number keys to tab names */
const TAB_KEYS: Record<string, string> = {
  '1': 'actions',
  '2': 'chores',
  '3': 'supplies',
  '4': 'market',
  '5': 'breeding',
  '6': 'training',
  '7': 'social',
  '8': 'more',
};

/**
 * Hook for keyboard shortcuts in the game interface
 *
 * Provides keyboard navigation and quick actions for power users.
 * Automatically ignores shortcuts when typing in input fields.
 *
 * @param actions - Callback functions for shortcut actions
 *
 * Supported shortcuts:
 * - F: Feed all cats
 * - N: Next day
 * - S / Ctrl+S: Save game
 * - C: Go to cat collection
 * - H: Go home (farm)
 * - G: Go to gallery
 * - P: Photo booth
 * - R: Relationships page
 * - L: Leaderboard page
 * - T: Trading tab
 * - B: Breeding tab
 * - M: Market tab
 * - O: Objectives tab
 * - W: Lucky Wheel tab
 * - 1-8: Switch between tabs
 * - ?: Show shortcuts help
 *
 * @example
 * ```tsx
 * useKeyboardShortcuts({
 *   onFeed: () => feedAllCats(),
 *   onNextDay: () => advanceDay(),
 *   onSave: () => saveGame(),
 *   onTabChange: (tab) => setActiveTab(tab)
 * });
 * ```
 */
export function useKeyboardShortcuts(actions: ShortcutActions) {
  const navigate = useNavigate();

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Ignore if typing in input
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return;
    }

    // Ignore if modifier keys are pressed (except for Ctrl+S)
    if (e.altKey || e.metaKey) return;

    const key = e.key.toLowerCase();

    // Ctrl+S - Save
    if (e.ctrlKey && key === 's') {
      e.preventDefault();
      actions.onSave?.();
      return;
    }

    if (e.ctrlKey) return;

    switch (key) {
      case 'f':
        e.preventDefault();
        actions.onFeed?.();
        break;
      case 'n':
        e.preventDefault();
        actions.onNextDay?.();
        break;
      case 's':
        e.preventDefault();
        actions.onSave?.();
        break;
      case 'c':
        e.preventDefault();
        navigate('/collection');
        break;
      case 'h':
        e.preventDefault();
        navigate('/');
        break;
      case 'g':
        e.preventDefault();
        navigate('/gallery');
        break;
      case 'p':
        e.preventDefault();
        navigate('/photobooth');
        break;
      case 'r':
        e.preventDefault();
        navigate('/relationships');
        break;
      case 'l':
        e.preventDefault();
        navigate('/leaderboard');
        break;
      case 't':
        e.preventDefault();
        actions.onTabChange?.('trading');
        break;
      case 'b':
        e.preventDefault();
        actions.onTabChange?.('breeding');
        break;
      case 'm':
        e.preventDefault();
        actions.onTabChange?.('market');
        break;
      case 'o':
        e.preventDefault();
        actions.onTabChange?.('objectives');
        break;
      case 'w':
        e.preventDefault();
        actions.onTabChange?.('wheel');
        break;
      case '?':
        // Show shortcuts help - handled by component
        break;
      default:
        // Number keys for tabs
        if (TAB_KEYS[key] && actions.onTabChange) {
          e.preventDefault();
          actions.onTabChange(TAB_KEYS[key]);
        }
    }
  }, [actions, navigate]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

/** List of available keyboard shortcuts for help display */
export const SHORTCUTS = [
  { key: 'F', description: 'Feed all cats' },
  { key: 'N', description: 'Next day' },
  { key: 'S', description: 'Save game' },
  { key: 'C', description: 'Cat collection' },
  { key: 'H', description: 'Home (farm)' },
  { key: 'G', description: 'Photo gallery' },
  { key: 'P', description: 'Photo booth' },
  { key: 'R', description: 'Relationships' },
  { key: 'L', description: 'Leaderboard' },
  { key: 'T', description: 'Trading tab' },
  { key: 'B', description: 'Breeding tab' },
  { key: 'M', description: 'Market tab' },
  { key: 'O', description: 'Objectives tab' },
  { key: 'W', description: 'Lucky Wheel tab' },
  { key: '1-8', description: 'Switch tabs' },
  { key: '?', description: 'Show shortcuts' },
];
