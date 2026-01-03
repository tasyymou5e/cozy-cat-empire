import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Cat, BREEDS } from '@/types/game';
import { CatRelationship, getRelationshipLevel, getRelationshipEmoji, getRelationshipColor } from '@/types/relationships';
import { TRICKS, MIN_SHOW_GRADE } from '@/types/grading';
import { GradeBadge } from './GradeBadge';
import { CatAvatar } from './CatAvatar';
import { CatPortrait } from './CatPortrait';
import { ComfortButton } from './ComfortButton';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Heart, HeartCrack, Trophy, Zap, DollarSign, Sparkles, Moon, Dumbbell, Palette } from 'lucide-react';

interface CatDetailModalProps {
  cat: Cat | null;
  relationships: CatRelationship[];
  allCats: Cat[];
  open: boolean;
  onClose: () => void;
  onComfort: (catId: string) => void;
  onHeal: (catId: string) => void;
  onSell: (catId: string) => void;
  onRest: (catId: string) => void;
  onTrain: (catId: string, trickId: string) => void;
  treats: number;
  equippedCostumeId?: string;
  onPortraitGenerated?: (catId: string, portraitUrl: string) => void;
}

const catEmojis: Record<string, string> = {
  'stray': '🐱', 'tabby': '🐈', 'persian': '😺', 'siamese': '😸',
  'maine-coon': '🦁', 'british-shorthair': '🐾', 'ragdoll': '💫', 'bengal': '🐆',
};

const personalityDescriptions: Record<string, string> = {
  'lazy': 'Loves to nap and relax. Low energy but easy to care for.',
  'playful': 'Full of energy! Needs lots of toys and attention.',
  'affectionate': 'Very loving and bonds quickly with others.',
  'independent': 'Self-sufficient but can be stubborn.',
  'curious': 'Always exploring. Learns tricks faster!',
  'shy': 'Takes time to warm up but loyal once bonded.',
};

export function CatDetailModal({ 
  cat, relationships, allCats, open, onClose, 
  onComfort, onHeal, onSell, onRest, onTrain, treats, equippedCostumeId, onPortraitGenerated
}: CatDetailModalProps) {
  const [activeTab, setActiveTab] = useState('stats');
  
  if (!cat) return null;

  const catRelationships = relationships.filter(r => r.catId1 === cat.id || r.catId2 === cat.id);
  const friends = catRelationships.filter(r => {
    const level = getRelationshipLevel(r.score);
    return level === 'friend' || level === 'bestFriend';
  });
  const enemies = catRelationships.filter(r => {
    const level = getRelationshipLevel(r.score);
    return level === 'enemy' || level === 'rival';
  });

  const needsComfort = cat.happiness < 50 || enemies.length > friends.length;
  const canEnterShow = cat.grade >= MIN_SHOW_GRADE;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <CatAvatar cat={cat} size="md" equippedCostumeId={equippedCostumeId} />
            <span>{cat.name}</span>
            <GradeBadge grade={cat.grade} size="lg" />
          </DialogTitle>
        </DialogHeader>

        {/* AI Portrait Section */}
        <div className="flex justify-center py-4 border-b border-border/50">
          <CatPortrait 
            cat={cat} 
            equippedCostumeId={equippedCostumeId}
            onPortraitGenerated={onPortraitGenerated}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: Cat Info */}
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-accent/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg font-semibold capitalize">{BREEDS[cat.breed].name}</span>
                <Badge variant="outline">{cat.type}</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                {personalityDescriptions[cat.personality]}
              </p>
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1">
                  <Zap className="h-4 w-4" /> Age: {cat.age} days
                </span>
                <span className="flex items-center gap-1">
                  <Trophy className="h-4 w-4 text-yellow-500" /> {cat.showWins} wins
                </span>
                <span className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4 text-green-500" /> ${cat.value}
                </span>
              </div>
            </div>

            {/* Stats Bars */}
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>❤️ Health</span>
                  <span>{cat.health}%</span>
                </div>
                <Progress value={cat.health} className="h-3" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>😊 Happiness</span>
                  <span>{cat.happiness}%</span>
                </div>
                <Progress value={cat.happiness} className="h-3" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>🍖 Fullness</span>
                  <span>{100 - cat.hunger}%</span>
                </div>
                <Progress value={100 - cat.hunger} className="h-3" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>💤 Rest Level</span>
                  <span>{cat.restLevel}%</span>
                </div>
                <Progress value={cat.restLevel} className="h-3" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>🍽️ Feeding Score</span>
                  <span>{cat.feedingScore}</span>
                </div>
                <Progress value={Math.min(cat.feedingScore, 100)} className="h-3" />
              </div>
            </div>
          </div>

          {/* Right: Tabs */}
          <div>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full grid grid-cols-3">
                <TabsTrigger value="stats">Tricks</TabsTrigger>
                <TabsTrigger value="social">Social</TabsTrigger>
                <TabsTrigger value="actions">Actions</TabsTrigger>
              </TabsList>

              <TabsContent value="stats" className="mt-4 space-y-4">
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Sparkles className="h-4 w-4" /> Learned Tricks
                  </h4>
                  {cat.tricksLearned.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No tricks learned yet</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {cat.tricksLearned.map(trickId => {
                        const trick = TRICKS.find(t => t.id === trickId);
                        return trick && (
                          <Badge key={trickId} variant="secondary">
                            {trick.emoji} {trick.name}
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Trick Progress</h4>
                  <div className="space-y-2">
                    {TRICKS.map(trick => {
                      const progress = cat.trickProgress[trick.id] || 0;
                      const learned = cat.tricksLearned.includes(trick.id);
                      return (
                        <div key={trick.id} className="flex items-center gap-2">
                          <span className="w-20 text-sm">{trick.emoji} {trick.name}</span>
                          <Progress value={learned ? 100 : progress} className="h-2 flex-1" />
                          <span className="text-xs w-10">{learned ? '✓' : `${progress}%`}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="social" className="mt-4 space-y-4">
                <div className="flex gap-4">
                  <div className="flex items-center gap-2 text-green-500">
                    <Heart className="h-5 w-5" />
                    <span className="font-semibold">{friends.length} Friends</span>
                  </div>
                  <div className="flex items-center gap-2 text-red-500">
                    <HeartCrack className="h-5 w-5" />
                    <span className="font-semibold">{enemies.length} Rivals</span>
                  </div>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {catRelationships.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No relationships yet</p>
                  ) : (
                    catRelationships.map(rel => {
                      const otherId = rel.catId1 === cat.id ? rel.catId2 : rel.catId1;
                      const other = allCats.find(c => c.id === otherId);
                      if (!other) return null;
                      const level = getRelationshipLevel(rel.score);
                      return (
                        <div key={otherId} className="flex items-center justify-between p-2 rounded bg-accent/20">
                          <div className="flex items-center gap-2">
                            <span>{catEmojis[other.breed]}</span>
                            <span className="font-medium">{other.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={getRelationshipColor(level)}>
                              {getRelationshipEmoji(level)} {level}
                            </span>
                            <span className="text-xs text-muted-foreground">({rel.score})</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </TabsContent>

              <TabsContent value="actions" className="mt-4 space-y-3">
                {needsComfort && (
                  <ComfortButton catId={cat.id} catName={cat.name} onComfort={onComfort} />
                )}
                
                {cat.health < 70 && (
                  <Button onClick={() => onHeal(cat.id)} className="w-full" variant="outline">
                    💊 Heal Cat
                  </Button>
                )}

                <Button onClick={() => onRest(cat.id)} className="w-full" variant="outline" disabled={cat.restLevel >= 100}>
                  <Moon className="h-4 w-4 mr-2" /> Rest Cat
                </Button>

                <div className="space-y-2">
                  <p className="text-sm font-medium flex items-center gap-2">
                    <Dumbbell className="h-4 w-4" /> Train Trick ({treats} treats)
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {TRICKS.filter(t => !cat.tricksLearned.includes(t.id)).map(trick => (
                      <Button
                        key={trick.id}
                        size="sm"
                        variant="outline"
                        disabled={treats < 1}
                        onClick={() => onTrain(cat.id, trick.id)}
                      >
                        {trick.emoji} {trick.name}
                      </Button>
                    ))}
                  </div>
                </div>

                {canEnterShow && (
                  <div className="p-2 rounded bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 text-sm text-center">
                    ✨ Show eligible! Enter from Status Bar
                  </div>
                )}

                <Link to={`/customize/${cat.id}`}>
                  <Button variant="outline" className="w-full">
                    <Palette className="h-4 w-4 mr-2" />
                    Customize Appearance
                  </Button>
                </Link>

                <Link to={`/photobooth/${cat.id}`}>
                  <Button variant="outline" className="w-full">
                    📸 Photo Booth
                  </Button>
                </Link>

                <Button onClick={() => onSell(cat.id)} variant="destructive" className="w-full">
                  💰 Sell for ${cat.value}
                </Button>

              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
