import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

interface ShortcutActions {
  onFeed?: () => void;
  onNextDay?: () => void;
  onSave?: () => void;
  onTabChange?: (tab: string) => void;
}

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

export const SHORTCUTS = [
  { key: 'F', description: 'Feed all cats' },
  { key: 'N', description: 'Next day' },
  { key: 'S', description: 'Save game' },
  { key: 'C', description: 'Cat collection' },
  { key: 'H', description: 'Home (farm)' },
  { key: '1-8', description: 'Switch tabs' },
  { key: '?', description: 'Show shortcuts' },
];
