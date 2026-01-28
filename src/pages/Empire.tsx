import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useGameState } from '@/hooks/game';
import { useSound } from '@/contexts/SoundContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCloudSave } from '@/hooks/useCloudSave';
import { GameLayout } from '@/components/layouts/GameLayout';
import { EmpireScene } from '@/components/empire/EmpireScene';
import { Breadcrumbs } from '@/components/game/Breadcrumbs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme } from 'next-themes';
import {
  Settings,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  Loader2,
} from 'lucide-react';

export default function Empire() {
  const { playSound, isEnabled, setEnabled } = useSound();
  const { theme, setTheme } = useTheme();
  const { state, actions, kittensBreed, relationshipSystem } = useGameState(playSound);
  const { user, loading: authLoading } = useAuth();
  const { cloudLoad, cloudSave } = useCloudSave(user?.id);

  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadedCloud, setHasLoadedCloud] = useState(false);

  // Load saved game on mount - with isMounted guard and auth loading gate
  useEffect(() => {
    // Phase 3: Wait for auth state to resolve before loading
    if (authLoading) return;
    if (hasLoadedCloud) return;

    let isMounted = true; // Phase 1: Async cancellation guard

    const loadSavedGame = async () => {
      if (user) {
        const { data } = await cloudLoad();
        if (!isMounted) return; // Cancel if unmounted
        if (data) {
          actions.loadFromData?.(data.game_state, data.kittens_bred, data.relationships);
          setHasLoadedCloud(true);
          setIsLoading(false);
          return;
        }
      }

      if (!isMounted) return; // Cancel if unmounted

      const saved = localStorage.getItem('cat-farm-save');
      if (saved) {
        try {
          const saveData = JSON.parse(saved);
          actions.loadFromData?.(
            saveData.state,
            saveData.kittensBreed || 0,
            saveData.relationships
          );
        } catch (e) {
          console.error('Failed to load local save:', e);
        }
      }
      if (isMounted) {
        setHasLoadedCloud(true);
        setIsLoading(false);
      }
    };

    loadSavedGame();

    return () => {
      isMounted = false;
    };
  }, [authLoading, user, hasLoadedCloud, cloudLoad, actions]);

  // Save after interactions - guarded by cloud load state
  const saveGame = useCallback(async () => {
    // Guard: Only save if cloud data has been loaded
    if (!hasLoadedCloud) {
      console.warn('[Empire] Skipping save - cloud data not loaded');
      return;
    }
    if (user) {
      const relationshipData = relationshipSystem.getRelationshipSaveData();
      await cloudSave(state, kittensBreed, relationshipData);
    }
  }, [user, cloudSave, state, kittensBreed, relationshipSystem]);

  // Interaction handlers
  const handlePetCat = useCallback((catId: string) => {
    // Pet action uses comfort to boost happiness
    actions.comfortCat(catId);
    saveGame();
  }, [actions, saveGame]);

  const handleFeedCat = useCallback((catId: string) => {
    if (state.resources.food > 0) {
      actions.feedSingleCat(catId);
      saveGame();
    }
  }, [actions, state.resources.food, saveGame]);

  const handlePlayWithCat = useCallback((catId: string) => {
    if (state.resources.toys > 0) {
      // Use toys for playtime (group action)
      actions.useToys();
      saveGame();
    }
  }, [actions, state.resources.toys, saveGame]);

  if (isLoading) {
    return (
      <GameLayout currentPage="/empire">
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading your empire...</p>
          </div>
        </div>
      </GameLayout>
    );
  }

  return (
    <GameLayout currentPage="/empire" day={state.day} money={state.money}>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4">
              <Breadcrumbs items={[{ label: 'Empire' }]} />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="min-h-10 min-w-10">
                    <Settings className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-popover">
                  <DropdownMenuLabel>Settings</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setEnabled(!isEnabled())}
                    className="cursor-pointer"
                  >
                    {isEnabled() ? (
                      <Volume2 className="h-4 w-4 mr-2" />
                    ) : (
                      <VolumeX className="h-4 w-4 mr-2" />
                    )}
                    {isEnabled() ? 'Mute Sounds' : 'Unmute Sounds'}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    className="cursor-pointer"
                  >
                    {theme === 'dark' ? (
                      <Sun className="h-4 w-4 mr-2" />
                    ) : (
                      <Moon className="h-4 w-4 mr-2" />
                    )}
                    {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex items-center gap-2 sm:gap-4 text-sm">
              <Badge variant="secondary" className="gap-1.5">
                <span>📅</span>
                <span>Day {state.day}</span>
              </Badge>
              <Badge variant="secondary" className="gap-1.5">
                <span>💰</span>
                <span>${state.money}</span>
              </Badge>
              <Badge variant="secondary" className="gap-1.5">
                <span>🐱</span>
                <span>{state.cats.length}/{state.space}</span>
              </Badge>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="max-w-7xl mx-auto px-4 py-6">
          <EmpireScene
            cats={state.cats}
            houseSize={state.houseSize}
            catCostumes={state.catCostumes}
            resources={state.resources}
            gameDay={state.day}
            onPetCat={handlePetCat}
            onFeedCat={handleFeedCat}
            onPlayWithCat={handlePlayWithCat}
          />

          {/* Info text */}
          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>Click on a cat to interact • Cats will roam around automatically</p>
          </div>
        </main>
      </div>
    </GameLayout>
  );
}
