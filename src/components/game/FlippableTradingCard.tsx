import { useState } from 'react';
import { Cat } from '@/types/game';
import { CatRelationship, getRelationshipLevel } from '@/types/relationships';
import { getGradeTier, getGradeStars, TRICKS, MAX_GRADE } from '@/types/grading';
import { GradeBadge } from './GradeBadge';
import { CatAvatar } from './CatAvatar';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Star, Heart, HeartCrack, Trophy, Zap, RotateCcw } from 'lucide-react';
import { useSound } from '@/contexts/SoundContext';

interface FlippableTradingCardProps {
  cat: Cat;
  relationships: CatRelationship[];
  allCats: Cat[];
  onClick: () => void;
  equippedCostumeId?: string;
}

const personalityEmojis: Record<string, string> = {
  'lazy': '😴', 'playful': '🎮', 'affectionate': '💗', 'independent': '😎', 'curious': '🔍', 'shy': '🙈',
};

const typeLabels: Record<string, { label: string; color: string }> = {
  'stray': { label: 'Stray', color: 'bg-gray-500' },
  'adopted': { label: 'Adopted', color: 'bg-blue-500' },
  'pure': { label: 'Purebred', color: 'bg-purple-500' },
};

export function FlippableTradingCard({ cat, relationships, allCats, onClick, equippedCostumeId }: FlippableTradingCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const tier = getGradeTier(cat.grade);
  const stars = getGradeStars(cat.grade);
  const { playSound } = useSound();
  
  const catRelationships = relationships.filter(r => r.catId1 === cat.id || r.catId2 === cat.id);
  const friends = catRelationships.filter(r => {
    const level = getRelationshipLevel(r.score);
    return level === 'friend' || level === 'bestFriend';
  });
  const enemies = catRelationships.filter(r => {
    const level = getRelationshipLevel(r.score);
    return level === 'enemy' || level === 'rival';
  });
  
  const bestFriendRel = catRelationships.find(r => getRelationshipLevel(r.score) === 'bestFriend');
  const bestFriendId = bestFriendRel ? (bestFriendRel.catId1 === cat.id ? bestFriendRel.catId2 : bestFriendRel.catId1) : null;
  const bestFriend = bestFriendId ? allCats.find(c => c.id === bestFriendId) : null;

  const cardBorders: Record<string, string> = {
    common: 'border-2 border-border',
    uncommon: 'border-2 border-blue-400 shadow-[0_0_12px_2px_rgba(59,130,246,0.35)] hover:shadow-[0_0_18px_4px_rgba(59,130,246,0.5)]',
    rare: 'border-2 border-purple-400 animate-purple-glow',
    veryRare: 'border-2 border-yellow-400 animate-golden-glow',
    ultraRare: 'border-2 animate-rainbow-glow',
  };

  const cardBg: Record<string, string> = {
    common: 'bg-card',
    uncommon: 'bg-gradient-to-b from-blue-50 to-card dark:from-blue-950/30',
    rare: 'bg-gradient-to-b from-purple-50 to-card dark:from-purple-950/30',
    veryRare: 'bg-gradient-to-b from-yellow-50 to-card dark:from-yellow-950/30',
    ultraRare: 'bg-gradient-to-br from-purple-100 via-pink-50 to-orange-100 dark:from-purple-950/50 dark:via-pink-950/30 dark:to-orange-950/50',
  };

  const handleFlip = (e: React.MouseEvent) => {
    e.stopPropagation();
    playSound('cardFlip');
    setIsFlipped(!isFlipped);
  };

  // Front of card
  const CardFront = (
    <div className={`${cardBg[tier]} rounded-lg p-3 h-full flex flex-col backface-hidden`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-lg">{personalityEmojis[cat.personality]}</span>
          <span className="font-bold text-sm truncate max-w-[100px]">{cat.name}</span>
        </div>
        <GradeBadge grade={cat.grade} size="sm" />
      </div>

      <div className="relative flex-shrink-0 h-24 flex items-center justify-center mb-2 rounded-md bg-gradient-to-b from-background/50 to-transparent">
        <CatAvatar 
          cat={cat} 
          size="lg" 
          equippedCostumeId={equippedCostumeId}
          animated={tier === 'ultraRare' || tier === 'veryRare'}
        />
        {tier === 'ultraRare' && (
          <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/10 to-white/30 animate-shimmer rounded-md" />
        )}
        {stars > 0 && (
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
            {Array.from({ length: stars }).map((_, i) => (
              <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium capitalize">{cat.breed.replace('-', ' ')}</span>
        <Badge className={`${typeLabels[cat.type].color} text-white text-[10px] px-1.5 py-0`}>
          {typeLabels[cat.type].label}
        </Badge>
      </div>

      <div className="space-y-1.5 mb-2 flex-grow">
        <div className="flex items-center gap-2">
          <span className="text-xs w-12">❤️ HP</span>
          <Progress value={cat.health} className="h-2 flex-1" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs w-12">😊 Joy</span>
          <Progress value={cat.happiness} className="h-2 flex-1" />
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-border pt-2 mt-auto">
        <div className="flex items-center gap-2 text-xs">
          <span className="flex items-center gap-0.5">
            <Trophy className="h-3 w-3 text-yellow-500" /> {cat.showWins}
          </span>
        </div>
        <span className="font-bold text-sm text-green-600 dark:text-green-400">${cat.value}</span>
      </div>

      {/* Flip indicator */}
      <button 
        onClick={handleFlip}
        className="absolute bottom-2 right-2 p-1 rounded-full bg-background/80 hover:bg-background text-muted-foreground hover:text-foreground transition-colors"
        title="Flip card"
      >
        <RotateCcw className="h-3 w-3" />
      </button>
    </div>
  );

  // Back of card
  const CardBack = (
    <div className={`${cardBg[tier]} rounded-lg p-3 h-full flex flex-col backface-hidden rotate-y-180`}>
      <div className="flex items-center justify-between mb-3">
        <span className="font-bold text-sm">{cat.name}</span>
        <Badge variant="outline" className="text-[10px]">Stats</Badge>
      </div>

      {/* Detailed Stats */}
      <div className="space-y-2 text-xs flex-grow">
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2 rounded bg-accent/30">
            <div className="text-muted-foreground">Age</div>
            <div className="font-bold">{cat.age} days</div>
          </div>
          <div className="p-2 rounded bg-accent/30">
            <div className="text-muted-foreground">Grade</div>
            <div className="font-bold">{cat.grade}/{MAX_GRADE}</div>
          </div>
        </div>

        <div className="p-2 rounded bg-accent/30">
          <div className="text-muted-foreground mb-1">Stats</div>
          <div className="grid grid-cols-2 gap-1 text-[10px]">
            <span>🍖 Hunger: {cat.hunger}%</span>
            <span>💤 Rest: {cat.restLevel}%</span>
            <span>🍽️ Feed: {cat.feedingScore}</span>
            <span>🏆 Wins: {cat.showWins}</span>
          </div>
        </div>

        <div className="p-2 rounded bg-accent/30">
          <div className="text-muted-foreground mb-1">Tricks ({cat.tricksLearned.length}/{TRICKS.length})</div>
          <div className="flex flex-wrap gap-1">
            {cat.tricksLearned.length > 0 ? (
              cat.tricksLearned.map(trickId => {
                const trick = TRICKS.find(t => t.id === trickId);
                return trick && <span key={trickId} title={trick.name}>{trick.emoji}</span>;
              })
            ) : (
              <span className="text-muted-foreground">None yet</span>
            )}
          </div>
        </div>

        <div className="p-2 rounded bg-accent/30">
          <div className="text-muted-foreground mb-1">Social</div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-green-500">
              <Heart className="h-3 w-3" /> {friends.length}
            </span>
            <span className="flex items-center gap-1 text-red-500">
              <HeartCrack className="h-3 w-3" /> {enemies.length}
            </span>
          </div>
          {bestFriend && (
            <div className="mt-1 text-pink-500">💕 BFF: {bestFriend.name}</div>
          )}
        </div>
      </div>

      {/* Flip back */}
      <button 
        onClick={handleFlip}
        className="absolute bottom-2 right-2 p-1 rounded-full bg-background/80 hover:bg-background text-muted-foreground hover:text-foreground transition-colors"
        title="Flip card"
      >
        <RotateCcw className="h-3 w-3" />
      </button>
    </div>
  );

  return (
    <div 
      onClick={onClick}
      className={`cursor-pointer transition-all duration-300 hover:scale-105 hover:-translate-y-1 rounded-lg overflow-hidden ${cardBorders[tier]} perspective-1000`}
      style={{ perspective: '1000px' }}
    >
      <div 
        className="relative w-full h-[320px] transition-transform duration-500"
        style={{ 
          transformStyle: 'preserve-3d',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
        }}
      >
        {/* Front */}
        <div 
          className="absolute inset-0"
          style={{ backfaceVisibility: 'hidden' }}
        >
          {tier === 'ultraRare' ? (
            <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 p-[2px] rounded-lg h-full">
              {CardFront}
            </div>
          ) : (
            CardFront
          )}
        </div>
        
        {/* Back */}
        <div 
          className="absolute inset-0"
          style={{ 
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)'
          }}
        >
          {tier === 'ultraRare' ? (
            <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 p-[2px] rounded-lg h-full">
              {CardBack}
            </div>
          ) : (
            CardBack
          )}
        </div>
      </div>
    </div>
  );
}
