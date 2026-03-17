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
import { PokemonCard } from '@/components/game/PokemonCard';
import { CardComparison, DeckBuilder, TradeAnimation } from '@/components/game/CardFeatures';
import { PackOpening } from '@/components/game/PackOpening';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
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
  BookOpen,
  Package,
  ArrowLeftRight,
  Layers,
  Swords,
  Sparkles,
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
  const [activeTab, setActiveTab] = useState('collection');
  const [isTrading, setIsTrading] = useState(false);
  const [collectedIds, setCollectedIds] = useState<Set<string>>(new Set());

  // Load saved game on mount
  useEffect(() => {
    if (authLoading) return;
    if (hasLoadedCloud) return;

    let isMounted = true;

    const loadSavedGame = async () => {
      if (user) {
        const { data } = await cloudLoad();
        if (!isMounted) return;
        if (data) {
          actions.loadFromData?.(data.game_state, data.kittens_bred, data.relationships);
          setHasLoadedCloud(true);
          setIsLoading(false);
          return;
        }
      }

      if (!isMounted) return;

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
    return () => { isMounted = false; };
  }, [authLoading, user, hasLoadedCloud, cloudLoad, actions]);

  // Sync collected IDs from game state
  useEffect(() => {
    if (state.cats.length > 0) {
      setCollectedIds(new Set(state.cats.map(c => c.id)));
    }
  }, [state.cats]);

  const outdatedCount = useMemo(() => {
    return state.cats.filter(
      (cat) => cat.portraitUrl && isPortraitOutdated(cat, state.catCostumes[cat.id])
    ).length;
  }, [state.cats, state.catCostumes]);

  const filteredAndSortedCats = useMemo(() => {
    let cats = [...state.cats];

    if (showOutdatedOnly) {
      cats = cats.filter((c) => c.portraitUrl && isPortraitOutdated(c, state.catCostumes[c.id]));
    }
    if (debouncedSearch) {
      cats = cats.filter((c) => c.name.toLowerCase().includes(debouncedSearch.toLowerCase()));
    }
    if (filterBreed !== 'all') {
      cats = cats.filter((c) => c.breed === filterBreed);
    }
    if (filterTier !== 'all') {
      cats = cats.filter((c) => getGradeTier(c.grade) === filterTier);
    }

    cats.sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case 'name': cmp = a.name.localeCompare(b.name); break;
        case 'grade': cmp = a.grade - b.grade; break;
        case 'value': cmp = a.value - b.value; break;
        case 'age': cmp = a.age - b.age; break;
        case 'health': cmp = a.health - b.health; break;
        case 'showWins': cmp = a.showWins - b.showWins; break;
      }
      return sortDesc ? -cmp : cmp;
    });

    return cats;
  }, [state.cats, debouncedSearch, sortBy, sortDesc, filterBreed, filterTier, showOutdatedOnly, state.catCostumes]);

  const totalValue = state.cats.reduce((sum, c) => sum + c.value, 0);
  const avgGrade = state.cats.length
    ? (state.cats.reduce((sum, c) => sum + c.grade, 0) / state.cats.length).toFixed(1)
    : '0';
  const totalWins = state.cats.reduce((sum, c) => sum + c.showWins, 0);

  const handleTrain = (catId: string, trickId: string) => {
    actions.trainCat(catId, trickId as TrickId);
  };

  const handlePortraitGenerated = async (catId: string, portraitUrl: string, hash?: string) => {
    actions.updateCatPortrait(catId, portraitUrl, hash);
    if (!hasLoadedCloud) return;
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

  const handlePackOpened = (cats: Cat[]) => {
    setCollectedIds(prev => {
      const next = new Set(prev);
      cats.forEach(c => next.add(c.id));
      return next;
    });
  };

  const showCollectionFilters = activeTab === 'collection';

  return (
    <GameLayout currentPage="/collection" day={state.day} money={state.money}>
      <div className="min-h-screen cozy-page-bg">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border px-4 py-3">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2 sm:gap-4">
              <Breadcrumbs items={[{ label: 'Cat Empire Cards' }]} />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="min-h-10 min-w-10">
                    <Settings className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-popover">
                  <DropdownMenuLabel>Settings</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setEnabled(!isEnabled())} className="cursor-pointer">
                    {isEnabled() ? <Volume2 className="h-4 w-4 mr-2" /> : <VolumeX className="h-4 w-4 mr-2" />}
                    {isEnabled() ? 'Mute Sounds' : 'Unmute Sounds'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="cursor-pointer">
                    {theme === 'dark' ? <Sun className="h-4 w-4 mr-2" /> : <Moon className="h-4 w-4 mr-2" />}
                    {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              {state.cats.length > 0 && activeTab === 'collection' && (
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

        {/* Tabs Navigation */}
        <div className="sticky top-[57px] z-40 bg-background/95 backdrop-blur border-b border-border px-4 py-3">
          <div className="max-w-7xl mx-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-6 w-full max-w-3xl">
                <TabsTrigger value="collection"><BookOpen className="h-3 w-3 mr-1" />Collection</TabsTrigger>
                <TabsTrigger value="cards">🃏 Cards</TabsTrigger>
                <TabsTrigger value="packs"><Package className="h-3 w-3 mr-1" />Packs</TabsTrigger>
                <TabsTrigger value="compare"><ArrowLeftRight className="h-3 w-3 mr-1" />Compare</TabsTrigger>
                <TabsTrigger value="deck"><Layers className="h-3 w-3 mr-1" />Deck</TabsTrigger>
                <TabsTrigger value="trade"><Swords className="h-3 w-3 mr-1" />Trade</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Collection filters - only show on collection tab */}
            {showCollectionFilters && (
              <div className="flex flex-wrap items-center gap-3 mt-3">
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
                        <SelectItem key={key} value={key}>{name}</SelectItem>
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
            )}
          </div>
        </div>

        {/* Tab Content */}
        <main className="max-w-7xl mx-auto px-4 py-6">
          {/* Collection Tab */}
          {activeTab === 'collection' && (
            <>
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
            </>
          )}

          {/* Cards Tab - Empire cards view */}
          {activeTab === 'cards' && (
            <div className="space-y-8 animate-fade-in">
              <SectionHeader title="Cat Empire Cards" />
              {state.cats.length === 0 ? (
                <div className="text-center py-16">
                  <span className="text-6xl mb-4 block">🃏</span>
                  <p className="text-muted-foreground">No cats to show as cards yet!</p>
                </div>
              ) : (
                <div className="grid gap-10 justify-items-center" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))' }}>
                  {filteredAndSortedCats.slice(0, 20).map((cat, i) => (
                    <div key={cat.id} className="animate-fade-in" style={{ animationDelay: `${i * 80}ms`, animationFillMode: 'both' }}>
                      <PokemonCard cat={cat} showFlip isOwned={collectedIds.has(cat.id)} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Packs Tab */}
          {activeTab === 'packs' && (
            <div className="space-y-8 animate-fade-in">
              <SectionHeader title="Pack Opening" />
              {state.cats.length === 0 ? (
                <div className="text-center py-16">
                  <span className="text-6xl mb-4 block">📦</span>
                  <p className="text-muted-foreground">You need cats to open packs!</p>
                </div>
              ) : (
                <PackOpening
                  availableCats={state.cats}
                  packSize={3}
                  onPackOpened={handlePackOpened}
                />
              )}
            </div>
          )}

          {/* Compare Tab */}
          {activeTab === 'compare' && (
            <div className="space-y-8 animate-fade-in">
              <SectionHeader title="Card Comparison" />
              {state.cats.length < 2 ? (
                <div className="text-center py-16">
                  <span className="text-6xl mb-4 block">⚖️</span>
                  <p className="text-muted-foreground">You need at least 2 cats to compare!</p>
                </div>
              ) : (
                <CardComparison cats={state.cats.slice(0, 5)} />
              )}
            </div>
          )}

          {/* Deck Tab */}
          {activeTab === 'deck' && (
            <div className="space-y-8 animate-fade-in">
              <SectionHeader title="Deck Builder" />
              {state.cats.length === 0 ? (
                <div className="text-center py-16">
                  <span className="text-6xl mb-4 block">🎴</span>
                  <p className="text-muted-foreground">You need cats to build a deck!</p>
                </div>
              ) : (
                <DeckBuilder availableCats={state.cats} maxDeckSize={6} />
              )}
            </div>
          )}

          {/* Trade Tab */}
          {activeTab === 'trade' && (
            <div className="space-y-8 animate-fade-in">
              <SectionHeader title="Trade Animation" />
              {state.cats.length < 2 ? (
                <div className="text-center py-16">
                  <span className="text-6xl mb-4 block">🔄</span>
                  <p className="text-muted-foreground">You need at least 2 cats to trade!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <TradeAnimation
                    sendCat={state.cats[0]}
                    receiveCat={state.cats[Math.min(1, state.cats.length - 1)]}
                    isPlaying={isTrading}
                    onComplete={() => setIsTrading(false)}
                  />
                  <div className="flex justify-center">
                    <Button onClick={() => setIsTrading(true)} disabled={isTrading} size="lg">
                      {isTrading ? '⏳ Trading...' : '🔄 Play Trade Animation'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
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

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3 mb-8">
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
      <h2 className="text-2xl font-semibold text-foreground tracking-tight">{title}</h2>
      <div className="h-px flex-1 bg-gradient-to-r from-border via-transparent to-transparent" />
    </div>
  );
}
