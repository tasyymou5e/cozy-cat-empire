import { useState, useMemo, useEffect } from 'react';
import type { TrickId } from '@/types/grading';
import { Link } from 'react-router-dom';
import { useGameState } from '@/hooks/game';
import { useSound } from '@/contexts/SoundContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCloudSave } from '@/hooks/useCloudSave';
import { GameLayout } from '@/components/layouts/GameLayout';
import { FullScreenNetworkGraph } from '@/components/game/FullScreenNetworkGraph';
import { RelationshipDirectory } from '@/components/game/RelationshipDirectory';
import { CatSocialProfile } from '@/components/game/CatSocialProfile';
import { CatDetailModal } from '@/components/game/CatDetailModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Cat } from '@/types/game';
import { CatGroup, RelationshipEvent, getRelationshipLevel } from '@/types/relationships';
import { CatVisual } from '@/components/game/CatVisual';
import {
  Settings,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  Network,
  Users,
  User,
  History,
  Loader2,
} from 'lucide-react';
import { Breadcrumbs } from '@/components/game/Breadcrumbs';
import { useTheme } from 'next-themes';

import { createLogger } from '@/lib/logger';

const logger = createLogger('CatRelationships');

export default function CatRelationships() {
  const { playSound, isEnabled, setEnabled } = useSound();
  const { theme, setTheme } = useTheme();
  const { state, kittensBreed, relationshipSystem, actions } = useGameState(playSound);
  const { user, loading: authLoading } = useAuth();
  const { cloudLoad } = useCloudSave(user?.id);

  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  const [detailCat, setDetailCat] = useState<Cat | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadedCloud, setHasLoadedCloud] = useState(false);
  const [eventFilter, setEventFilter] = useState<'all' | 'positive' | 'negative'>('all');

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
            saveData.kittensBreek || 0,
            saveData.relationships
          );
        } catch (e) {
          logger.error('Failed to load local save:', e);
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

  // Calculate stats
  const stats = useMemo(() => {
    const rels = relationshipSystem.relationships;
    return {
      bestFriends: rels.filter((r) => r.level === 'bestFriend').length,
      friends: rels.filter((r) => r.level === 'friend').length,
      neutral: rels.filter((r) => r.level === 'neutral').length,
      rivals: rels.filter((r) => r.level === 'rival').length,
      enemies: rels.filter((r) => r.level === 'enemy').length,
      total: rels.length,
    };
  }, [relationshipSystem.relationships]);

  // Filter events
  const filteredEvents = useMemo(() => {
    const events = relationshipSystem.events;
    if (eventFilter === 'all') return events;
    return events.filter((e) => e.type === eventFilter);
  }, [relationshipSystem.events, eventFilter]);

  const selectedCat = selectedCatId ? state.cats.find((c) => c.id === selectedCatId) : null;

  const handleTrain = (catId: string, trickId: string) => {
    actions.trainCat(catId, trickId as TrickId);
  };

  if (isLoading) {
    return (
      <GameLayout currentPage="/relationships">
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading relationships...</p>
          </div>
        </div>
      </GameLayout>
    );
  }

  return (
    <GameLayout currentPage="/relationships" day={state.day} money={state.money}>
      <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Breadcrumbs items={[{ label: 'Cat Relationships' }]} />
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
                <DropdownMenuSeparator />
                <Link to="/collection">
                  <DropdownMenuItem className="cursor-pointer">🎴 Cat Collection</DropdownMenuItem>
                </Link>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Stats badges */}
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="bg-pink-50 text-pink-600 border-pink-200 dark:bg-pink-950/30 dark:text-pink-400 dark:border-pink-800"
            >
              💕 {stats.bestFriends}
            </Badge>
            <Badge
              variant="outline"
              className="bg-green-50 text-green-600 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800"
            >
              💚 {stats.friends}
            </Badge>
            <Badge
              variant="outline"
              className="bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-800"
            >
              😾 {stats.rivals}
            </Badge>
            <Badge
              variant="outline"
              className="bg-red-50 text-red-600 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800"
            >
              💔 {stats.enemies}
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {state.cats.length === 0 ? (
          <div className="text-center py-16">
            <span className="text-6xl mb-4 block">🐾</span>
            <p className="text-muted-foreground">
              No cats yet! Go back and adopt some to see their relationships.
            </p>
            <Link to="/">
              <Button className="mt-4">Go to Farm</Button>
            </Link>
          </div>
        ) : (
          <Tabs defaultValue="network" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="network" className="flex items-center gap-2">
                <Network className="h-4 w-4" />
                <span className="hidden sm:inline">Network</span>
              </TabsTrigger>
              <TabsTrigger value="directory" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Directory</span>
              </TabsTrigger>
              <TabsTrigger value="profiles" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Profiles</span>
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                <span className="hidden sm:inline">History</span>
              </TabsTrigger>
            </TabsList>

            {/* Network Tab */}
            <TabsContent value="network" className="mt-0">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Relationship Network</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Interactive visualization of all cat relationships. Click a cat to see details.
                  </p>
                </CardHeader>
                <CardContent>
                  <FullScreenNetworkGraph
                    cats={state.cats}
                    relationships={relationshipSystem.relationships}
                    catCostumes={state.catCostumes}
                    onCatClick={(catId) => {
                      const cat = state.cats.find((c) => c.id === catId);
                      if (cat) setDetailCat(cat);
                    }}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Directory Tab */}
            <TabsContent value="directory" className="mt-0">
              <RelationshipDirectory
                cats={state.cats}
                relationships={relationshipSystem.relationships}
                catCostumes={state.catCostumes}
                events={relationshipSystem.events}
                currentDay={state.day}
                onCatClick={(catId) => {
                  const cat = state.cats.find((c) => c.id === catId);
                  if (cat) setDetailCat(cat);
                }}
              />
            </TabsContent>

            {/* Profiles Tab */}
            <TabsContent value="profiles" className="mt-0">
              <div className="grid md:grid-cols-3 gap-6">
                {/* Cat Selector */}
                <Card className="md:col-span-1">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Select a Cat</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[500px]">
                      <div className="space-y-2">
                        {state.cats.map((cat) => {
                          const catRels = relationshipSystem.relationships.filter(
                            (r) => r.catId1 === cat.id || r.catId2 === cat.id
                          );
                          const friendCount = catRels.filter((r) => r.score >= 20).length;
                          const enemyCount = catRels.filter((r) => r.score <= -20).length;

                          return (
                            <div
                              key={cat.id}
                              className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                                selectedCatId === cat.id
                                  ? 'bg-primary/10 border-primary'
                                  : 'bg-secondary/30 border-border hover:bg-secondary/50'
                              }`}
                              onClick={() => setSelectedCatId(cat.id)}
                            >
                              <div className="flex items-center gap-3">
                                <CatVisual
                                  cat={cat}
                                  size="sm"
                                  equippedCostumeId={state.catCostumes[cat.id]}
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">{cat.name}</p>
                                  <div className="flex gap-2 text-xs text-muted-foreground">
                                    <span>💚 {friendCount}</span>
                                    <span>💔 {enemyCount}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>

                {/* Social Profile */}
                <div className="md:col-span-2">
                  {selectedCat ? (
                    <CatSocialProfile
                      cat={selectedCat}
                      allCats={state.cats}
                      relationships={relationshipSystem.relationships}
                      catCostumes={state.catCostumes}
                      currentDay={state.day}
                      onCatClick={(catId) => {
                        const cat = state.cats.find((c) => c.id === catId);
                        if (cat) setDetailCat(cat);
                      }}
                    />
                  ) : (
                    <Card className="h-full flex items-center justify-center">
                      <p className="text-muted-foreground">
                        Select a cat to view their social profile
                      </p>
                    </Card>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="mt-0">
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Relationship History</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        All recorded interactions between your cats
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Badge
                        variant={eventFilter === 'all' ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => setEventFilter('all')}
                      >
                        All
                      </Badge>
                      <Badge
                        variant={eventFilter === 'positive' ? 'default' : 'outline'}
                        className="cursor-pointer bg-green-100 text-green-700 border-green-200 hover:bg-green-200"
                        onClick={() => setEventFilter('positive')}
                      >
                        Positive
                      </Badge>
                      <Badge
                        variant={eventFilter === 'negative' ? 'default' : 'outline'}
                        className="cursor-pointer bg-red-100 text-red-700 border-red-200 hover:bg-red-200"
                        onClick={() => setEventFilter('negative')}
                      >
                        Negative
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px]">
                    {filteredEvents.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No interactions recorded yet.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {filteredEvents.map((event) => {
                          const cat1 = state.cats.find((c) => c.id === event.catId1);
                          const cat2 = state.cats.find((c) => c.id === event.catId2);

                          return (
                            <div
                              key={event.id}
                              className={`p-4 rounded-lg border ${
                                event.type === 'positive'
                                  ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800'
                                  : event.type === 'negative'
                                    ? 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800'
                                    : 'bg-secondary/30 border-border'
                              }`}
                            >
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                  {cat1 && (
                                    <CatVisual
                                      cat={cat1}
                                      size="xs"
                                      equippedCostumeId={state.catCostumes[cat1.id]}
                                    />
                                  )}
                                  <span className="font-medium text-sm">{event.catName1}</span>
                                </div>
                                <span className="text-lg">
                                  {event.type === 'positive'
                                    ? '💚'
                                    : event.type === 'negative'
                                      ? '💔'
                                      : '😐'}
                                </span>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm">{event.catName2}</span>
                                  {cat2 && (
                                    <CatVisual
                                      cat={cat2}
                                      size="xs"
                                      equippedCostumeId={state.catCostumes[cat2.id]}
                                    />
                                  )}
                                </div>
                                <Badge
                                  variant="outline"
                                  className={`ml-auto ${
                                    event.scoreChange > 0 ? 'text-green-600' : 'text-red-600'
                                  }`}
                                >
                                  {event.scoreChange > 0 ? '+' : ''}
                                  {event.scoreChange}
                                </Badge>
                              </div>
                              <p className="mt-2 text-sm">{event.message}</p>
                              <p className="mt-1 text-xs text-muted-foreground">Day {event.day}</p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Groups Section */}
              <Card className="mt-6">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Social Groups</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Cats that have formed social cliques
                  </p>
                </CardHeader>
                <CardContent>
                  {relationshipSystem.groups.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No social groups formed yet. Cats need strong friendships to form groups!
                    </p>
                  ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {relationshipSystem.groups.map((group: CatGroup) => {
                        const leader = state.cats.find((c) => c.id === group.leaderCatId);
                        return (
                          <div
                            key={group.id}
                            className={`p-4 rounded-lg border ${
                              group.type === 'friendly'
                                ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800'
                                : group.type === 'outcasts'
                                  ? 'bg-muted/30 border-border'
                                  : 'bg-orange-50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-800'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <span className="font-semibold">{group.name}</span>
                              <Badge variant="outline" className="text-xs">
                                {group.memberIds.length} cats
                              </Badge>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {group.memberIds.map((id) => {
                                const cat = state.cats.find((c) => c.id === id);
                                const isLeader = id === group.leaderCatId;
                                return cat ? (
                                  <div
                                    key={id}
                                    className="flex items-center gap-1 p-1 rounded bg-background/50"
                                  >
                                    {isLeader && <span className="text-xs">👑</span>}
                                    <CatVisual
                                      cat={cat}
                                      size="xs"
                                      equippedCostumeId={state.catCostumes[cat.id]}
                                    />
                                    <span className="text-xs font-medium">{cat.name}</span>
                                  </div>
                                ) : null;
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </main>

      {/* Detail Modal */}
      <CatDetailModal
        cat={detailCat}
        relationships={relationshipSystem.relationships}
        allCats={state.cats}
        open={!!detailCat}
        onClose={() => setDetailCat(null)}
        onComfort={actions.comfortCat}
        onHeal={actions.useMedicine}
        onSell={(id) => {
          actions.sellCat(id);
          setDetailCat(null);
        }}
        onRest={actions.restCat}
        onTrain={handleTrain}
        onRename={actions.renameCat}
        treats={state.resources.treats}
        equippedCostumeId={detailCat ? state.catCostumes[detailCat.id] : undefined}
      />
      </div>
    </GameLayout>
  );
}
