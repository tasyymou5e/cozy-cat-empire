import { useState, useMemo, useEffect, useCallback } from 'react';
import type { TrickId } from '@/types/grading';
import { useDebouncedSearch } from '@/hooks/useDebouncedSearch';
import { Link } from 'react-router-dom';
import { useGameState } from '@/hooks/game';
import { useSound } from '@/contexts/SoundContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';
import { useCloudSave } from '@/hooks/useCloudSave';
import { GameLayout } from '@/components/layouts/GameLayout';
import { VirtualizedCatGrid } from '@/components/game/VirtualizedCatGrid';
import { Breadcrumbs } from '@/components/game/Breadcrumbs';
import { CatDetailModal } from '@/components/game/CatDetailModal';
import { BatchPortraitGenerator } from '@/components/game/BatchPortraitGenerator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Cat, CatBreed, BREEDS } from '@/types/game';
import { getGradeTier } from '@/types/grading';
import { isPortraitOutdated } from '@/lib/portraitUtils';
import {
  Search,
  SortAsc,
  Filter,
  Cat as CatIcon,
  Trophy,
  DollarSign,
  Star,
  Loader2,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  Settings,
  RefreshCw,
  X,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

type SortOption = 'name' | 'grade' | 'value' | 'age' | 'health' | 'showWins';
type FilterBreed = CatBreed | 'all';
type FilterTier = 'all' | 'common' | 'uncommon' | 'rare' | 'veryRare' | 'ultraRare';

export default function CatCollection() {
  const { playSound, isEnabled, setEnabled } = useSound();
  const { theme, setTheme } = useTheme();
  const { state, kittensBreed, relationshipSystem, actions } = useGameState(playSound);
  const isMobile = useIsMobile();
  const { user, loading: authLoading } = useAuth();
  const { cloudLoad, cloudSave } = useCloudSave(user?.id);

  const [search, setSearch, debouncedSearch] = useDebouncedSearch('', 300);
  const [sortBy, setSortBy] = useState<SortOption>('grade');
  const [sortDesc, setSortDesc] = useState(true);
  const [filterBreed, setFilterBreed] = useState<FilterBreed>('all');
  const [filterTier, setFilterTier] = useState<FilterTier>('all');
  const [showOutdatedOnly, setShowOutdatedOnly] = useState(false);
  const [selectedCat, setSelectedCat] = useState<Cat | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadedCloud, setHasLoadedCloud] = useState(false);

  // Load saved game on mount - with isMounted guard and auth loading gate
  useEffect(() => {
    // Phase 3: Wait for auth state to resolve before loading
    if (authLoading) return;
    if (hasLoadedCloud) return;

    let isMounted = true; // Phase 1: Async cancellation guard

    const loadSavedGame = async () => {
      // Try cloud save first if logged in
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

      // Fall back to localStorage
      const saved = localStorage.getItem('cat-farm-save');
      if (saved) {
        try {
          const saveData = JSON.parse(saved);
          actions.loadFromData?.(
            saveData.state,
            saveData.kittensBreek || 0,
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

  // Calculate outdated portrait count
  const outdatedCount = useMemo(() => {
    return state.cats.filter(
      (cat) => cat.portraitUrl && isPortraitOutdated(cat, state.catCostumes[cat.id])
    ).length;
  }, [state.cats, state.catCostumes]);

  const filteredAndSortedCats = useMemo(() => {
    let cats = [...state.cats];

    // Filter by outdated portraits
    if (showOutdatedOnly) {
      cats = cats.filter((c) => c.portraitUrl && isPortraitOutdated(c, state.catCostumes[c.id]));
    }

    // Filter by search (using debounced value)
    if (debouncedSearch) {
      cats = cats.filter((c) => c.name.toLowerCase().includes(debouncedSearch.toLowerCase()));
    }

    // Filter by breed
    if (filterBreed !== 'all') {
      cats = cats.filter((c) => c.breed === filterBreed);
    }

    // Filter by tier
    if (filterTier !== 'all') {
      cats = cats.filter((c) => getGradeTier(c.grade) === filterTier);
    }

    // Sort
    cats.sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case 'name':
          cmp = a.name.localeCompare(b.name);
          break;
        case 'grade':
          cmp = a.grade - b.grade;
          break;
        case 'value':
          cmp = a.value - b.value;
          break;
        case 'age':
          cmp = a.age - b.age;
          break;
        case 'health':
          cmp = a.health - b.health;
          break;
        case 'showWins':
          cmp = a.showWins - b.showWins;
          break;
      }
      return sortDesc ? -cmp : cmp;
    });

    return cats;
  }, [
    state.cats,
    debouncedSearch,
    sortBy,
    sortDesc,
    filterBreed,
    filterTier,
    showOutdatedOnly,
    state.catCostumes,
  ]);

  // Stats summary
  const totalValue = state.cats.reduce((sum, c) => sum + c.value, 0);
  const avgGrade = state.cats.length
    ? (state.cats.reduce((sum, c) => sum + c.grade, 0) / state.cats.length).toFixed(1)
    : '0';
  const totalWins = state.cats.reduce((sum, c) => sum + c.showWins, 0);

  const handleTrain = (catId: string, trickId: string) => {
    actions.trainCat(catId, trickId as TrickId);
  };

  // Handle portrait generation with cloud save - guarded by cloud load state
  const handlePortraitGenerated = async (catId: string, portraitUrl: string, hash?: string) => {
    // Update local state first
    actions.updateCatPortrait(catId, portraitUrl, hash);

    // Guard: Only save if cloud data has been loaded
    if (!hasLoadedCloud) {
      console.warn('[CatCollection] Skipping cloud save - not loaded yet');
      return;
    }

    // Save to cloud if logged in
    if (user) {
      const updatedState = {
        ...state,
        cats: state.cats.map((c) =>
          c.id === catId ? { ...c, portraitUrl, appearanceHash: hash } : c
        ),
      };
      const relationshipData = relationshipSystem.getRelationshipSaveData();
      await cloudSave(updatedState, kittensBreed, relationshipData);
    }
  };

  return (
    <GameLayout currentPage="/collection" day={state.day} money={state.money}>
      <div className="min-h-screen cozy-page-bg">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border px-4 py-3">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2 sm:gap-4">
              <Breadcrumbs items={[{ label: 'Collection' }]} />
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
              {state.cats.length > 0 && (
                <BatchPortraitGenerator
                  cats={state.cats}
                  catCostumes={state.catCostumes}
                  onPortraitGenerated={handlePortraitGenerated}
                  currentMoney={state.money}
                  onMoneyChange={actions.setMoney}
                />
              )}
            </div>

            <div className="grid grid-cols-4 sm:flex sm:items-center gap-2 sm:gap-4 text-sm">
              <div className="flex items-center justify-center gap-1 sm:gap-1.5 bg-accent/50 px-2 sm:px-3 py-1.5 rounded-full">
                <CatIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="font-medium text-xs sm:text-sm">{state.cats.length}</span>
              </div>
              <div className="flex items-center justify-center gap-1 sm:gap-1.5 bg-accent/50 px-2 sm:px-3 py-1.5 rounded-full">
                <Star className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-yellow-500" />
                <span className="font-medium text-xs sm:text-sm">{avgGrade}</span>
              </div>
              <div className="flex items-center justify-center gap-1 sm:gap-1.5 bg-accent/50 px-2 sm:px-3 py-1.5 rounded-full">
                <Trophy className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-yellow-500" />
                <span className="font-medium text-xs sm:text-sm">{totalWins}</span>
              </div>
              <div className="flex items-center justify-center gap-1 sm:gap-1.5 bg-accent/50 px-2 sm:px-3 py-1.5 rounded-full">
                <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500" />
                <span className="font-medium text-xs sm:text-sm">${totalValue}</span>
              </div>
              {outdatedCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowOutdatedOnly(!showOutdatedOnly)}
                  className={cn(
                    'flex items-center gap-1.5 px-2 sm:px-3 py-1.5 h-auto rounded-full transition-colors',
                    showOutdatedOnly
                      ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 hover:bg-orange-200 dark:hover:bg-orange-900/40'
                      : 'bg-accent/50 hover:bg-orange-100 dark:hover:bg-orange-900/20'
                  )}
                >
                  <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-orange-500" />
                  <span className="font-medium text-xs sm:text-sm">{outdatedCount}</span>
                  <span className="hidden sm:inline text-xs">outdated</span>
                </Button>
              )}
            </div>
          </div>
        </header>

        {/* Filters */}
        <div className="sticky top-[57px] z-40 bg-background/95 backdrop-blur border-b border-border px-4 py-3">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search cats..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="flex items-center gap-2">
              <SortAsc className="h-4 w-4 text-muted-foreground" />
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="grade">Grade</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="value">Value</SelectItem>
                  <SelectItem value="age">Age</SelectItem>
                  <SelectItem value="health">Health</SelectItem>
                  <SelectItem value="showWins">Show Wins</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={() => setSortDesc(!sortDesc)}>
                {sortDesc ? '↓' : '↑'}
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={filterBreed} onValueChange={(v) => setFilterBreed(v as FilterBreed)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Breed" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Breeds</SelectItem>
                  {Object.entries(BREEDS).map(([key, { name }]) => (
                    <SelectItem key={key} value={key}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterTier} onValueChange={(v) => setFilterTier(v as FilterTier)}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tiers</SelectItem>
                  <SelectItem value="common">Common</SelectItem>
                  <SelectItem value="uncommon">Uncommon</SelectItem>
                  <SelectItem value="rare">Rare</SelectItem>
                  <SelectItem value="veryRare">Very Rare</SelectItem>
                  <SelectItem value="ultraRare">Ultra Rare</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {showOutdatedOnly && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowOutdatedOnly(false)}
                className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 gap-2 hover:bg-orange-200 dark:hover:bg-orange-900/40"
              >
                <RefreshCw className="h-4 w-4" />
                Showing {outdatedCount} outdated
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Grid */}
        <main className="max-w-7xl mx-auto px-4 py-6">
          {isLoading ? (
            <div className="text-center py-16">
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">Loading your cats...</p>
            </div>
          ) : filteredAndSortedCats.length === 0 ? (
            <div className="text-center py-16">
              <span className="text-6xl mb-4 block">🐾</span>
              <p className="text-muted-foreground">
                {state.cats.length === 0
                  ? 'No cats yet! Go back and adopt some.'
                  : 'No cats match your filters.'}
              </p>
            </div>
          ) : (
            <VirtualizedCatGrid
              cats={filteredAndSortedCats}
              relationships={relationshipSystem.relationships}
              allCats={state.cats}
              catCostumes={state.catCostumes}
              variant="trading"
              onClick={(cat) => setSelectedCat(cat)}
              showFlip
              animated
              className="grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
            />
          )}
        </main>

        {/* Detail Modal */}
        <CatDetailModal
          cat={selectedCat}
          relationships={relationshipSystem.relationships}
          allCats={state.cats}
          open={!!selectedCat}
          onClose={() => setSelectedCat(null)}
          onComfort={actions.comfortCat}
          onHeal={actions.useMedicine}
          onSell={(id) => {
            actions.sellCat(id);
            setSelectedCat(null);
          }}
          onRest={actions.restCat}
          onTrain={handleTrain}
          onRename={actions.renameCat}
          treats={state.resources.treats}
          equippedCostumeId={selectedCat ? state.catCostumes[selectedCat.id] : undefined}
          onPortraitGenerated={handlePortraitGenerated}
          currentMoney={state.money}
          onMoneyChange={actions.setMoney}
        />
      </div>
    </GameLayout>
  );
}
