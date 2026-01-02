import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useGameState } from '@/hooks/useGameState';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useConfetti } from '@/hooks/useConfetti';
import { StatusBar } from './StatusBar';
import { MessageBar } from './MessageBar';
import { ActionPanel } from './ActionPanel';
import { ResourcePanel } from './ResourcePanel';
import { ChorePanel } from './ChorePanel';
import { MarketPanel } from './MarketPanel';
import { BreedingPanel } from './BreedingPanel';
import { AchievementsPanel } from './AchievementsPanel';
import { SaveLoadPanel } from './SaveLoadPanel';
import { SocializePanel } from './SocializePanel';
import { RelationshipPanel } from './RelationshipPanel';
import { MatchmakingPanel } from './MatchmakingPanel';
import { GroupActivitiesPanel } from './GroupActivitiesPanel';
import { TrainingPanel } from './TrainingPanel';
import { RelationshipAnimations } from './RelationshipAnimations';
import { CatCard } from './CatCard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Volume2, VolumeX, Music, Music2, Settings2, LayoutGrid } from 'lucide-react';

const MOOD_LABELS = {
  morning: '🌅 Morning',
  afternoon: '☀️ Afternoon', 
  evening: '🌆 Evening',
  night: '🌙 Night',
  celebration: '🎉 Celebration',
  tense: '⚡ Tense',
};

export function CatFarm() {
  const { 
    playSound, setEnabled, isEnabled, setVolume, getVolume,
    startMusic, stopMusic, isMusicPlaying, setMusicVolume,
    updateMusicForDay, getCurrentMood, triggerCelebration, triggerTense 
  } = useSoundEffects();
  const { fireConfetti, fireCelebration, fireStars } = useConfetti();
  const { state, message, messageType, kittensBreed, relationshipSystem, actions } = useGameState(playSound);
  const [sideTab, setSideTab] = useState('actions');
  const [soundOn, setSoundOn] = useState(true);
  const [musicOn, setMusicOn] = useState(false);
  const [currentMoodLabel, setCurrentMoodLabel] = useState('');
  const [sfxVolume, setSfxVolume] = useState(50);
  const [musicVolume, setMusicVolumeState] = useState(40);
  const [lastAchievementCount, setLastAchievementCount] = useState(0);

  // Update music mood when day changes
  useEffect(() => {
    if (musicOn) {
      updateMusicForDay(state.day);
      setCurrentMoodLabel(MOOD_LABELS[getCurrentMood()]);
    }
  }, [state.day, musicOn, updateMusicForDay, getCurrentMood]);

  // Fire confetti on achievements
  useEffect(() => {
    const unlockedCount = state.achievements.filter(a => a.unlocked).length;
    if (unlockedCount > lastAchievementCount && lastAchievementCount > 0) {
      fireStars();
      if (musicOn) {
        triggerCelebration();
        setCurrentMoodLabel(MOOD_LABELS.celebration);
        setTimeout(() => setCurrentMoodLabel(MOOD_LABELS[getCurrentMood()]), 10000);
      }
    }
    setLastAchievementCount(unlockedCount);
  }, [state.achievements, lastAchievementCount, fireStars, musicOn, triggerCelebration, getCurrentMood]);

  // Fire confetti on show wins
  useEffect(() => {
    if (message?.includes('wins!') && message?.includes('Cat show')) {
      fireCelebration();
      if (musicOn) {
        triggerCelebration();
        setCurrentMoodLabel(MOOD_LABELS.celebration);
        setTimeout(() => setCurrentMoodLabel(MOOD_LABELS[getCurrentMood()]), 10000);
      }
    }
  }, [message, fireCelebration, musicOn, triggerCelebration, getCurrentMood]);

  // Trigger tense mood on negative events
  useEffect(() => {
    if (musicOn && (message?.includes('fight') || message?.includes('sick') || message?.includes('ran away') || message?.includes('passed away'))) {
      triggerTense();
      setCurrentMoodLabel(MOOD_LABELS.tense);
      setTimeout(() => setCurrentMoodLabel(MOOD_LABELS[getCurrentMood()]), 6000);
    }
  }, [message, musicOn, triggerTense, getCurrentMood]);

  const toggleSound = () => {
    const newState = !soundOn;
    setSoundOn(newState);
    setEnabled(newState);
    if (newState) playSound('click');
  };

  const toggleMusic = () => {
    if (musicOn) {
      stopMusic();
      setMusicOn(false);
      setCurrentMoodLabel('');
    } else {
      startMusic();
      setMusicOn(true);
      updateMusicForDay(state.day);
      setCurrentMoodLabel(MOOD_LABELS[getCurrentMood()]);
      playSound('click');
    }
  };

  const handleSfxVolumeChange = (value: number[]) => {
    const vol = value[0];
    setSfxVolume(vol);
    setVolume(vol / 100);
  };

  const handleMusicVolumeChange = (value: number[]) => {
    const vol = value[0];
    setMusicVolumeState(vol);
    setMusicVolume((vol / 100) * 0.3);
  };

  return (
    <div className="min-h-screen bg-background">
      <RelationshipAnimations events={relationshipSystem.events} lastEventId={relationshipSystem.lastEventId} />
      
      <header className="game-header">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">🐱 Cat Farm</h1>
          <span className="text-xs text-muted-foreground hidden sm:inline">Build your 100-acre cat empire!</span>
        </div>
        <div className="flex items-center gap-2">
          {musicOn && currentMoodLabel && (
            <span className="text-xs text-muted-foreground hidden sm:inline">{currentMoodLabel}</span>
          )}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" title="Audio settings">
                <Settings2 className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64" align="end">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Volume2 className="h-4 w-4" /> Sound Effects
                    </label>
                    <span className="text-xs text-muted-foreground">{sfxVolume}%</span>
                  </div>
                  <Slider
                    value={[sfxVolume]}
                    onValueChange={handleSfxVolumeChange}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Music className="h-4 w-4" /> Music
                    </label>
                    <span className="text-xs text-muted-foreground">{musicVolume}%</span>
                  </div>
                  <Slider
                    value={[musicVolume]}
                    onValueChange={handleMusicVolumeChange}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <Button variant="ghost" size="sm" onClick={toggleMusic} title={musicOn ? "Stop music" : "Play ambient music"}>
            {musicOn ? <Music2 className="h-4 w-4 text-primary" /> : <Music className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="sm" onClick={toggleSound} title={soundOn ? "Mute sounds" : "Unmute sounds"}>
            {soundOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </Button>
          <Link to="/collection">
            <Button variant="ghost" size="sm" title="Cat Collection">
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </Link>
          <Button variant="ghost" size="sm" onClick={actions.saveGame}>💾</Button>
          <Button variant="ghost" size="sm" onClick={actions.resetGame}>New Game</Button>
        </div>
      </header>

      <StatusBar state={state} onUpgrade={actions.upgradeHouse} onCatShow={actions.catShow} relationships={relationshipSystem.relationships} />
      <MessageBar message={message} type={messageType} />

      <main className="game-main">
        <section className="cat-grid-section">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground">Your Cats</h2>
            <span className="text-sm text-muted-foreground">{state.cats.length} / {state.space} capacity</span>
          </div>
          
          {state.cats.length === 0 ? (
            <div className="empty-state">
              <span className="text-6xl mb-4">🐾</span>
              <p className="text-muted-foreground mb-2">No cats yet!</p>
              <p className="text-sm text-muted-foreground">Add a stray for free or buy from the market.</p>
            </div>
          ) : (
            <div className="cat-grid">
              {state.cats.map(cat => (
                <CatCard 
                  key={cat.id} 
                  cat={cat} 
                  onSell={actions.sellCat} 
                  onHeal={actions.useMedicine}
                  onComfort={actions.comfortCat}
                  relationships={relationshipSystem.relationships} 
                  allCats={state.cats} 
                />
              ))}
            </div>
          )}
        </section>

        <aside className="action-sidebar">
          <Tabs value={sideTab} onValueChange={setSideTab} className="w-full">
            <TabsList className="grid w-full grid-cols-8 mb-4">
              <TabsTrigger value="actions" className="text-xs">🐾</TabsTrigger>
              <TabsTrigger value="chores" className="text-xs">🧹</TabsTrigger>
              <TabsTrigger value="supplies" className="text-xs">📦</TabsTrigger>
              <TabsTrigger value="market" className="text-xs">🛒</TabsTrigger>
              <TabsTrigger value="breeding" className="text-xs">💕</TabsTrigger>
              <TabsTrigger value="training" className="text-xs">💪</TabsTrigger>
              <TabsTrigger value="social" className="text-xs">🤝</TabsTrigger>
              <TabsTrigger value="more" className="text-xs">⚙️</TabsTrigger>
            </TabsList>
            
            <TabsContent value="actions" className="mt-0">
              <ActionPanel onAddCat={actions.addCat} onNextDay={actions.nextDay} money={state.money} space={state.space} catCount={state.cats.length} />
            </TabsContent>
            <TabsContent value="chores" className="mt-0"><ChorePanel onDoChore={actions.doChore} /></TabsContent>
            <TabsContent value="supplies" className="mt-0">
              <ResourcePanel resources={state.resources} money={state.money} catCount={state.cats.length}
                onBuyResource={actions.buyResource} onFeedCats={actions.feedCats} onUseToys={actions.useToys} />
            </TabsContent>
            <TabsContent value="market" className="mt-0">
              <MarketPanel listings={state.marketListings} money={state.money} hasSpace={state.cats.length < state.space} onBuy={actions.buyFromMarket} />
            </TabsContent>
            <TabsContent value="breeding" className="mt-0">
              <BreedingPanel cats={state.cats} cooldown={state.breedingCooldown} hasSpace={state.cats.length < state.space}
                onBreed={actions.breedCats} getBreedingCompatibility={relationshipSystem.getBreedingCompatibility} />
            </TabsContent>
            <TabsContent value="training" className="mt-0">
              <TrainingPanel cats={state.cats} treats={state.resources.treats} toys={state.resources.toys}
                day={state.day} onTrain={actions.trainCat} onRest={actions.restCat} />
            </TabsContent>
            <TabsContent value="social" className="mt-0 space-y-4">
              <SocializePanel cats={state.cats} treats={state.resources.treats}
                getRelationship={relationshipSystem.getRelationship} onSocialize={actions.socializeCats} />
              <MatchmakingPanel cats={state.cats} relationships={relationshipSystem.relationships}
                onSocialize={actions.socializeCats} treats={state.resources.treats} />
              <GroupActivitiesPanel cats={state.cats} groups={relationshipSystem.groups}
                treats={state.resources.treats} toys={state.resources.toys} onGroupActivity={actions.doGroupActivity} />
              <RelationshipPanel cats={state.cats} relationships={relationshipSystem.relationships}
                groups={relationshipSystem.groups} events={relationshipSystem.events} />
            </TabsContent>
            <TabsContent value="more" className="mt-0 space-y-4">
              <AchievementsPanel achievements={state.achievements}
                currentStats={{ cats: state.cats.length, showWins: state.totalShowWins, money: state.totalMoneyEarned,
                  breeding: kittensBreed, house: state.houseSize !== 'apartment', farm: state.houseSize === 'farm', acres: state.acres }} />
              <SaveLoadPanel onSave={actions.saveGame} onLoad={actions.loadGame} hasSave={actions.hasSaveGame()} lastSaveDay={actions.getSaveDay()} />
            </TabsContent>
          </Tabs>
        </aside>
      </main>
    </div>
  );
}
