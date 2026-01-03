import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useGameState } from '@/hooks/useGameState';
import { useSound } from '@/contexts/SoundContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCloudSave } from '@/hooks/useCloudSave';
import { usePortraitOutdatedToast } from '@/hooks/usePortraitOutdatedToast';
import { CatAvatar } from '@/components/game/CatAvatar';
import { GradeBadge } from '@/components/game/GradeBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Cat, BREEDS } from '@/types/game';
import { 
  CatAppearance, FurColor, FurPattern, EyeColor, HairLength, FacialFeature,
  FUR_COLORS, PATTERNS, EYE_COLORS, HAIR_LENGTHS, FACIAL_FEATURES, PATTERN_COLORS,
  generateDefaultAppearance, randomizeAppearance,
} from '@/types/catAppearance';
import { COSTUMES, getCostumeById } from '@/types/costumes';
import { computeAppearanceHash } from '@/lib/portraitUtils';
import { ArrowLeft, Save, RotateCcw, Shuffle, Palette, Eye, Scissors, Smile, Shirt, Loader2, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

/**
 * CatCustomization - Cat appearance editor page
 * 
 * Full-page cat customization experience allowing players to edit
 * fur color, pattern, eye color, hair length, facial features, and
 * equip costumes. Supports live preview and cloud save.
 * 
 * @route /customize/:catId?
 * 
 * @example
 * ```tsx
 * <Route path="/customize/:catId?" element={<CatCustomization />} />
 * ```
 */
export default function CatCustomization() {
  const { catId } = useParams<{ catId?: string }>();
  const navigate = useNavigate();
  const { playSound } = useSound();
  const { state, kittensBreed, relationshipSystem, actions } = useGameState(playSound);
  const { user } = useAuth();
  const { cloudLoad, cloudSave } = useCloudSave(user?.id);
  const { showOutdatedToast } = usePortraitOutdatedToast();
  
  const [selectedCatId, setSelectedCatId] = useState<string | null>(catId || null);
  const [editedAppearance, setEditedAppearance] = useState<CatAppearance | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasLoadedCloud, setHasLoadedCloud] = useState(false);

  // Load saved game on mount
  useEffect(() => {
    if (hasLoadedCloud) return;
    
    const loadSavedGame = async () => {
      if (user) {
        const { data } = await cloudLoad();
        if (data) {
          actions.loadFromData?.(data.game_state, data.kittens_bred, data.relationships);
          setHasLoadedCloud(true);
          setIsLoading(false);
          return;
        }
      }
      
      const saved = localStorage.getItem('cat-farm-save');
      if (saved) {
        try {
          const saveData = JSON.parse(saved);
          actions.loadFromData?.(saveData.state, saveData.kittensBreed || 0, saveData.relationships);
        } catch (e) {
          console.error('Failed to load local save:', e);
        }
      }
      setHasLoadedCloud(true);
      setIsLoading(false);
    };
    
    loadSavedGame();
  }, [user, hasLoadedCloud, cloudLoad, actions]);

  const selectedCat = state.cats.find(c => c.id === selectedCatId) || state.cats[0];
  const currentAppearance = editedAppearance || selectedCat?.appearance || (selectedCat ? generateDefaultAppearance(selectedCat.breed) : null);
  const equippedCostumeId = selectedCat ? state.catCostumes[selectedCat.id] : undefined;

  // Update edited appearance when cat changes
  useEffect(() => {
    if (selectedCat) {
      setEditedAppearance(selectedCat.appearance || generateDefaultAppearance(selectedCat.breed));
      setHasChanges(false);
    }
  }, [selectedCatId, selectedCat?.id]);

  // Set initial cat from URL param
  useEffect(() => {
    if (catId && state.cats.find(c => c.id === catId)) {
      setSelectedCatId(catId);
    } else if (!selectedCatId && state.cats.length > 0) {
      setSelectedCatId(state.cats[0].id);
    }
  }, [catId, state.cats, selectedCatId]);

  const updateAppearance = (updates: Partial<CatAppearance>) => {
    if (!currentAppearance) return;
    setEditedAppearance({ ...currentAppearance, ...updates });
    setHasChanges(true);
    playSound('click');
  };

  const handleSave = async () => {
    if (!selectedCat || !editedAppearance) return;
    setIsSaving(true);
    
    // Check if portrait will become outdated before saving
    const hadPortrait = selectedCat.portraitUrl && selectedCat.appearanceHash;
    const oldHash = selectedCat.appearanceHash;
    const newHash = computeAppearanceHash(
      { ...selectedCat, appearance: editedAppearance },
      equippedCostumeId
    );
    const willBeOutdated = hadPortrait && oldHash !== newHash;
    
    // Update the cat's appearance in game state
    actions.updateCatAppearance?.(selectedCat.id, editedAppearance);
    
    // Save to local
    actions.saveGame();
    
    // Save to cloud if logged in
    if (user) {
      const updatedGameState = {
        ...state,
        cats: state.cats.map(c => 
          c.id === selectedCat.id 
            ? { ...c, appearance: editedAppearance }
            : c
        ),
      };
      const relationshipData = relationshipSystem.getRelationshipSaveData();
      await cloudSave(updatedGameState, kittensBreed, relationshipData);
    }
    
    setHasChanges(false);
    setIsSaving(false);
    playSound('success');
    
    // Show toast if portrait became outdated
    if (willBeOutdated) {
      showOutdatedToast(selectedCat);
    }
  };

  const handleReset = () => {
    if (!selectedCat) return;
    setEditedAppearance(generateDefaultAppearance(selectedCat.breed));
    setHasChanges(true);
    playSound('click');
  };

  const handleRandomize = () => {
    setEditedAppearance(randomizeAppearance());
    setHasChanges(true);
    playSound('cardFlip');
  };

  const handleEquipCostume = (costumeId: string) => {
    if (!selectedCat) return;
    actions.equipCostume(selectedCat.id, costumeId);
    playSound('success');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (state.cats.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <span className="text-6xl">🐾</span>
        <p className="text-muted-foreground">No cats to customize yet!</p>
        <Link to="/">
          <Button>Go adopt some cats</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/collection">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Collection
              </Button>
            </Link>
            <h1 className="text-xl font-bold">✨ Cat Customization</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <Link to={selectedCat ? `/photobooth/${selectedCat.id}` : '/photobooth'}>
              <Button variant="outline" size="sm">
                📸 Photo Booth
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={handleRandomize}>
              <Shuffle className="h-4 w-4 mr-2" />
              Randomize
            </Button>
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button size="sm" onClick={handleSave} disabled={!hasChanges || isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Cat Preview */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Preview</span>
                {hasChanges && <Badge variant="secondary">Unsaved</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              {/* Cat Selector */}
              <Select value={selectedCatId || ''} onValueChange={setSelectedCatId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a cat" />
                </SelectTrigger>
                <SelectContent>
                  {state.cats.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name} - {BREEDS[cat.breed].name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Large Preview */}
              {selectedCat && currentAppearance && (
                <div className="flex flex-col items-center gap-4 py-6">
                  <div className="relative">
                    <CatAvatar 
                      cat={{ ...selectedCat, appearance: editedAppearance || undefined }} 
                      equippedCostumeId={equippedCostumeId}
                      size="xl"
                      showCostume
                      animated
                    />
                  </div>
                  <div className="text-center">
                    <h3 className="font-bold text-lg">{selectedCat.name}</h3>
                    <p className="text-sm text-muted-foreground">{BREEDS[selectedCat.breed].name}</p>
                    <GradeBadge grade={selectedCat.grade} size="sm" />
                  </div>
                </div>
              )}

              {/* Size variants preview */}
              {selectedCat && currentAppearance && (
                <div className="flex items-end gap-3 pt-4 border-t border-border w-full justify-center">
                  <CatAvatar cat={{ ...selectedCat, appearance: editedAppearance || undefined }} size="xs" equippedCostumeId={equippedCostumeId} />
                  <CatAvatar cat={{ ...selectedCat, appearance: editedAppearance || undefined }} size="sm" equippedCostumeId={equippedCostumeId} />
                  <CatAvatar cat={{ ...selectedCat, appearance: editedAppearance || undefined }} size="md" equippedCostumeId={equippedCostumeId} />
                  <CatAvatar cat={{ ...selectedCat, appearance: editedAppearance || undefined }} size="lg" equippedCostumeId={equippedCostumeId} />
                </div>
              )}

              {/* Portrait Invalidation Warning */}
              {selectedCat?.portraitUrl && hasChanges && (
                <Alert className="bg-orange-50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-800">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  <AlertDescription className="text-xs text-orange-700 dark:text-orange-300">
                    Saving changes will mark the AI portrait as outdated. You can regenerate it in the Photo Booth.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Right: Editor Tabs */}
          <Card className="lg:col-span-2">
            <CardContent className="pt-6">
              <Tabs defaultValue="fur">
                <TabsList className="grid grid-cols-5 w-full">
                  <TabsTrigger value="fur" className="flex items-center gap-1">
                    <Palette className="h-4 w-4" />
                    <span className="hidden sm:inline">Fur</span>
                  </TabsTrigger>
                  <TabsTrigger value="eyes" className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    <span className="hidden sm:inline">Eyes</span>
                  </TabsTrigger>
                  <TabsTrigger value="hair" className="flex items-center gap-1">
                    <Scissors className="h-4 w-4" />
                    <span className="hidden sm:inline">Hair</span>
                  </TabsTrigger>
                  <TabsTrigger value="face" className="flex items-center gap-1">
                    <Smile className="h-4 w-4" />
                    <span className="hidden sm:inline">Face</span>
                  </TabsTrigger>
                  <TabsTrigger value="costume" className="flex items-center gap-1">
                    <Shirt className="h-4 w-4" />
                    <span className="hidden sm:inline">Costume</span>
                  </TabsTrigger>
                </TabsList>

                {/* Fur Tab */}
                <TabsContent value="fur" className="space-y-6 mt-6">
                  <div>
                    <h4 className="font-semibold mb-3">Fur Color</h4>
                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                      {(Object.entries(FUR_COLORS) as [FurColor, { hex: string; name: string }][]).map(([key, { hex, name }]) => (
                        <button
                          key={key}
                          onClick={() => updateAppearance({ furColor: key })}
                          className={`aspect-square rounded-lg border-2 transition-all hover:scale-105 ${
                            currentAppearance?.furColor === key ? 'border-primary ring-2 ring-primary/50' : 'border-border'
                          }`}
                          style={{ backgroundColor: hex }}
                          title={name}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">Pattern</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {(Object.entries(PATTERNS) as [FurPattern, { name: string; description: string }][]).map(([key, { name, description }]) => (
                        <button
                          key={key}
                          onClick={() => updateAppearance({ pattern: key })}
                          className={`p-3 rounded-lg border-2 text-left transition-all hover:bg-accent ${
                            currentAppearance?.pattern === key ? 'border-primary bg-primary/10' : 'border-border'
                          }`}
                        >
                          <div className="font-medium">{name}</div>
                          <div className="text-xs text-muted-foreground">{description}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {currentAppearance?.pattern !== 'solid' && (
                    <div>
                      <h4 className="font-semibold mb-3">Pattern Color</h4>
                      <div className="grid grid-cols-5 gap-2">
                        {Object.entries(PATTERN_COLORS).map(([hex, { name }]) => (
                          <button
                            key={hex}
                            onClick={() => updateAppearance({ patternColor: hex })}
                            className={`aspect-square rounded-lg border-2 transition-all hover:scale-105 ${
                              currentAppearance?.patternColor === hex ? 'border-primary ring-2 ring-primary/50' : 'border-border'
                            }`}
                            style={{ backgroundColor: hex }}
                            title={name}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* Eyes Tab */}
                <TabsContent value="eyes" className="space-y-6 mt-6">
                  <div>
                    <h4 className="font-semibold mb-3">Eye Color</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {(Object.entries(EYE_COLORS) as [EyeColor, { hex: string; name: string; secondary?: string }][]).map(([key, { hex, name, secondary }]) => (
                        <button
                          key={key}
                          onClick={() => updateAppearance({ eyeColor: key })}
                          className={`p-4 rounded-lg border-2 flex items-center gap-3 transition-all hover:bg-accent ${
                            currentAppearance?.eyeColor === key ? 'border-primary bg-primary/10' : 'border-border'
                          }`}
                        >
                          <div className="flex gap-1">
                            <div 
                              className="w-6 h-6 rounded-full" 
                              style={{ backgroundColor: hex }}
                            />
                            {secondary && (
                              <div 
                                className="w-6 h-6 rounded-full" 
                                style={{ backgroundColor: secondary }}
                              />
                            )}
                          </div>
                          <span className="font-medium">{name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                {/* Hair Tab */}
                <TabsContent value="hair" className="space-y-6 mt-6">
                  <div>
                    <h4 className="font-semibold mb-3">Hair Length</h4>
                    <div className="grid grid-cols-3 gap-3">
                      {(Object.entries(HAIR_LENGTHS) as [HairLength, { name: string; description: string }][]).map(([key, { name, description }]) => (
                        <button
                          key={key}
                          onClick={() => updateAppearance({ hairLength: key })}
                          className={`p-4 rounded-lg border-2 text-center transition-all hover:bg-accent ${
                            currentAppearance?.hairLength === key ? 'border-primary bg-primary/10' : 'border-border'
                          }`}
                        >
                          <div className="text-2xl mb-2">
                            {key === 'short' ? '🐱' : key === 'medium' ? '😺' : '🦁'}
                          </div>
                          <div className="font-medium">{name}</div>
                          <div className="text-xs text-muted-foreground">{description}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                {/* Face Tab */}
                <TabsContent value="face" className="space-y-6 mt-6">
                  <div>
                    <h4 className="font-semibold mb-3">Facial Feature</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {(Object.entries(FACIAL_FEATURES) as [FacialFeature, { name: string; emoji: string }][]).map(([key, { name, emoji }]) => (
                        <button
                          key={key}
                          onClick={() => updateAppearance({ facialFeature: key })}
                          className={`p-4 rounded-lg border-2 text-center transition-all hover:bg-accent ${
                            currentAppearance?.facialFeature === key ? 'border-primary bg-primary/10' : 'border-border'
                          }`}
                        >
                          <div className="text-2xl mb-2">{emoji || '😺'}</div>
                          <div className="font-medium">{name}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                {/* Costume Tab */}
                <TabsContent value="costume" className="space-y-6 mt-6">
                  <div>
                    <h4 className="font-semibold mb-3">Equipped Costume</h4>
                    {equippedCostumeId ? (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/50 mb-4">
                        <span className="text-2xl">{getCostumeById(equippedCostumeId)?.emoji}</span>
                        <div>
                          <div className="font-medium">{getCostumeById(equippedCostumeId)?.name}</div>
                          <div className="text-xs text-muted-foreground">{getCostumeById(equippedCostumeId)?.description}</div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="ml-auto"
                          onClick={() => selectedCat && actions.equipCostume(selectedCat.id, '')}
                        >
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground mb-4">No costume equipped</p>
                    )}
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">Owned Costumes ({state.ownedCostumes.length})</h4>
                    {state.ownedCostumes.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No costumes owned. Visit the Costume Shop to buy some!
                      </p>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {state.ownedCostumes.map(costumeId => {
                          const costume = getCostumeById(costumeId);
                          if (!costume) return null;
                          const isEquipped = equippedCostumeId === costumeId;
                          return (
                            <button
                              key={costumeId}
                              onClick={() => handleEquipCostume(costumeId)}
                              className={`p-3 rounded-lg border-2 text-left transition-all hover:bg-accent ${
                                isEquipped ? 'border-primary bg-primary/10' : 'border-border'
                              }`}
                            >
                              <div className="text-2xl mb-1">{costume.emoji}</div>
                              <div className="text-sm font-medium truncate">{costume.name}</div>
                              <Badge variant="outline" className="text-[10px] mt-1">
                                {costume.category}
                              </Badge>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
