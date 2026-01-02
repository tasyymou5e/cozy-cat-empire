import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useGameState } from '@/hooks/useGameState';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { FlippableTradingCard } from '@/components/game/FlippableTradingCard';
import { CatDetailModal } from '@/components/game/CatDetailModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Cat, CatBreed, BREEDS } from '@/types/game';
import { getGradeTier } from '@/types/grading';
import { ArrowLeft, Search, SortAsc, Filter, Cat as CatIcon, Trophy, DollarSign, Star } from 'lucide-react';

type SortOption = 'name' | 'grade' | 'value' | 'age' | 'health' | 'showWins';
type FilterBreed = CatBreed | 'all';
type FilterTier = 'all' | 'common' | 'uncommon' | 'rare' | 'veryRare' | 'ultraRare';

export default function CatCollection() {
  const { playSound } = useSoundEffects();
  const { state, relationshipSystem, actions } = useGameState(playSound);
  
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('grade');
  const [sortDesc, setSortDesc] = useState(true);
  const [filterBreed, setFilterBreed] = useState<FilterBreed>('all');
  const [filterTier, setFilterTier] = useState<FilterTier>('all');
  const [selectedCat, setSelectedCat] = useState<Cat | null>(null);

  const filteredAndSortedCats = useMemo(() => {
    let cats = [...state.cats];

    // Filter by search
    if (search) {
      cats = cats.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
    }

    // Filter by breed
    if (filterBreed !== 'all') {
      cats = cats.filter(c => c.breed === filterBreed);
    }

    // Filter by tier
    if (filterTier !== 'all') {
      cats = cats.filter(c => getGradeTier(c.grade) === filterTier);
    }

    // Sort
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
  }, [state.cats, search, sortBy, sortDesc, filterBreed, filterTier]);

  // Stats summary
  const totalValue = state.cats.reduce((sum, c) => sum + c.value, 0);
  const avgGrade = state.cats.length ? (state.cats.reduce((sum, c) => sum + c.grade, 0) / state.cats.length).toFixed(1) : '0';
  const totalWins = state.cats.reduce((sum, c) => sum + c.showWins, 0);

  const handleTrain = (catId: string, trickId: string) => {
    actions.trainCat(catId, trickId as any);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to Farm
              </Button>
            </Link>
            <h1 className="text-xl font-bold">🎴 Cat Collection</h1>
          </div>
          
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5 bg-accent/50 px-3 py-1.5 rounded-full">
              <CatIcon className="h-4 w-4" />
              <span className="font-medium">{state.cats.length}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-accent/50 px-3 py-1.5 rounded-full">
              <Star className="h-4 w-4 text-yellow-500" />
              <span className="font-medium">Avg {avgGrade}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-accent/50 px-3 py-1.5 rounded-full">
              <Trophy className="h-4 w-4 text-yellow-500" />
              <span className="font-medium">{totalWins}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-accent/50 px-3 py-1.5 rounded-full">
              <DollarSign className="h-4 w-4 text-green-500" />
              <span className="font-medium">${totalValue}</span>
            </div>
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
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => setSortDesc(!sortDesc)}
            >
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
        </div>
      </div>

      {/* Grid */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {filteredAndSortedCats.length === 0 ? (
          <div className="text-center py-16">
            <span className="text-6xl mb-4 block">🐾</span>
            <p className="text-muted-foreground">
              {state.cats.length === 0 
                ? "No cats yet! Go back and adopt some." 
                : "No cats match your filters."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredAndSortedCats.map(cat => (
              <FlippableTradingCard
                key={cat.id}
                cat={cat}
                relationships={relationshipSystem.relationships}
                allCats={state.cats}
                onClick={() => setSelectedCat(cat)}
              />
            ))}
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
        onSell={(id) => { actions.sellCat(id); setSelectedCat(null); }}
        onRest={actions.restCat}
        onTrain={handleTrain}
        treats={state.resources.treats}
      />
    </div>
  );
}
