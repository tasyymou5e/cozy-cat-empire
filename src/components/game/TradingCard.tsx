import { Cat } from '@/types/game';
import { CatRelationship, getRelationshipLevel, getRelationshipEmoji } from '@/types/relationships';
import { getGradeTier, getGradeStars, TRICKS } from '@/types/grading';
import { GradeBadge } from './GradeBadge';
import { CatAvatar } from './CatAvatar';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Star, Heart, HeartCrack, Trophy, Zap } from 'lucide-react';

interface TradingCardProps {
  cat: Cat;
  relationships: CatRelationship[];
  allCats: Cat[];
  onClick: () => void;
  equippedCostumeId?: string;
}

const typeLabels: Record<string, { label: string; color: string }> = {
  'stray': { label: 'Stray', color: 'bg-gray-500' },
  'adopted': { label: 'Adopted', color: 'bg-blue-500' },
  'pure': { label: 'Purebred', color: 'bg-purple-500' },
};

export function TradingCard({ cat, relationships, allCats, onClick, equippedCostumeId }: TradingCardProps) {
  const tier = getGradeTier(cat.grade);
  const stars = getGradeStars(cat.grade);
  
  // Get relationship stats
  const catRelationships = relationships.filter(r => r.catId1 === cat.id || r.catId2 === cat.id);
  const friends = catRelationships.filter(r => {
    const level = getRelationshipLevel(r.score);
    return level === 'friend' || level === 'bestFriend';
  });
  const enemies = catRelationships.filter(r => {
    const level = getRelationshipLevel(r.score);
    return level === 'enemy' || level === 'rival';
  });
  
  // Find best friend
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

  const innerCard = (
    <div className={`${cardBg[tier]} rounded-lg p-3 h-full flex flex-col`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="font-bold text-sm truncate max-w-[100px]">{cat.name}</span>
        <GradeBadge grade={cat.grade} size="sm" />
      </div>
      {/* Cat Display */}
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

      {/* Breed & Type */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium capitalize">{cat.breed.replace('-', ' ')}</span>
        <Badge className={`${typeLabels[cat.type].color} text-white text-[10px] px-1.5 py-0`}>
          {typeLabels[cat.type].label}
        </Badge>
      </div>

      {/* Stats */}
      <div className="space-y-1.5 mb-2 flex-grow">
        <div className="flex items-center gap-2">
          <span className="text-xs w-12">❤️ HP</span>
          <Progress value={cat.health} className="h-2 flex-1" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs w-12">😊 Joy</span>
          <Progress value={cat.happiness} className="h-2 flex-1" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs w-12">🍖 Full</span>
          <Progress value={100 - cat.hunger} className="h-2 flex-1" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs w-12">💤 Rest</span>
          <Progress value={cat.restLevel} className="h-2 flex-1" />
        </div>
      </div>

      {/* Tricks */}
      {cat.tricksLearned.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {cat.tricksLearned.map(trickId => {
            const trick = TRICKS.find(t => t.id === trickId);
            return trick && (
              <span key={trickId} className="text-xs bg-accent/50 px-1.5 py-0.5 rounded" title={trick.name}>
                {trick.emoji}
              </span>
            );
          })}
        </div>
      )}

      {/* Footer Stats */}
      <div className="flex items-center justify-between border-t border-border pt-2 mt-auto">
        <div className="flex items-center gap-2 text-xs">
          <span className="flex items-center gap-0.5">
            <Trophy className="h-3 w-3 text-yellow-500" /> {cat.showWins}
          </span>
          <span className="flex items-center gap-0.5">
            <Zap className="h-3 w-3 text-blue-500" /> {cat.age}d
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <span className="flex items-center gap-0.5 text-green-500">
            <Heart className="h-3 w-3" /> {friends.length}
          </span>
          <span className="flex items-center gap-0.5 text-red-500">
            <HeartCrack className="h-3 w-3" /> {enemies.length}
          </span>
        </div>
      </div>

      {/* Best Friend */}
      {bestFriend && (
        <div className="text-[10px] text-center text-pink-500 mt-1">
          💕 BFF: {bestFriend.name}
        </div>
      )}

      {/* Value */}
      <div className="text-center font-bold text-sm text-green-600 dark:text-green-400 mt-1">
        ${cat.value}
      </div>
    </div>
  );

  return (
    <div 
      onClick={onClick}
      className={`cursor-pointer transition-all duration-300 hover:scale-105 hover:-translate-y-1 rounded-lg overflow-hidden ${cardBorders[tier]}`}
    >
      {tier === 'ultraRare' ? (
        <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 p-[2px] rounded-lg">
          {innerCard}
        </div>
      ) : (
        innerCard
      )}
    </div>
  );
}
