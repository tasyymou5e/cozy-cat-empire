import { useState, useRef, useEffect } from 'react';
import { Cat, BREEDS } from '@/types/game';
import { CatRelationship } from '@/types/relationships';
import { getGradeBorderClass } from '@/types/grading';
import { GradeBadge } from './GradeBadge';
import { CatAvatar } from './CatAvatar';
import { ComfortButton } from './ComfortButton';
import { CatCardReaction } from './CatCardReaction';
import { CatReaction } from '@/contexts/CatReactionContext';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Pencil, Check, X, Shuffle } from 'lucide-react';

const FUN_CAT_NAMES = [
  'Whiskers', 'Mittens', 'Shadow', 'Luna', 'Oliver', 'Mochi', 'Ginger',
  'Patches', 'Smokey', 'Tiger', 'Cleo', 'Felix', 'Bella', 'Max', 'Coco',
  'Biscuit', 'Waffle', 'Muffin', 'Cookie', 'Nacho', 'Taco', 'Sushi', 'Tofu',
  'Pancake', 'Noodle', 'Dumpling', 'Pretzel', 'Nugget', 'Wonton', 'Pickles',
  'Sir Fluffington', 'Captain Whiskers', 'Lord Meowington', 'Princess Paws',
  'Duke Snuggles', 'Baron Von Purr', 'Countess Cuddles', 'Sir Hiss-a-lot',
  'Gandalf', 'Yoda', 'Dumbledore', 'Sherlock', 'Watson', 'Dobby', 'Gollum',
  'Pepper', 'Storm', 'Midnight', 'Sunny', 'Willow', 'Clover', 'Hazel',
  'Bubbles', 'Sprinkles', 'Cupcake', 'Jellybean', 'Snickers', 'Twix', 'KitKat',
  'Sebastian', 'Penelope', 'Theodore', 'Anastasia', 'Reginald', 'Clementine',
  'Chaos', 'Trouble', 'Rascal', 'Bandit', 'Mischief', 'Gremlin', 'Goblin',
];
interface CatCardProps {
  cat: Cat;
  onSell: (id: string) => void;
  onHeal: (id: string) => void;
  onComfort?: (id: string) => void;
  onRename?: (catId: string, newName: string) => void;
  compact?: boolean;
  relationships?: CatRelationship[];
  allCats?: Cat[];
  equippedCostumeId?: string;
  reaction?: CatReaction;
}

const personalityEmojis: Record<string, string> = {
  'lazy': '😴', 'playful': '🎾', 'affectionate': '💕',
  'independent': '😎', 'curious': '🔍', 'shy': '🙈',
};

export function CatCard({ cat, onSell, onHeal, onComfort, onRename, compact = false, relationships = [], allCats = [], equippedCostumeId, reaction }: CatCardProps) {
  const breedInfo = BREEDS[cat.breed];
  const isHealthy = cat.health >= 70;
  const gradeBorder = getGradeBorderClass(cat.grade);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(cat.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setEditName(cat.name);
  }, [cat.name]);

  const handleStartEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditName(cat.name);
    setIsEditing(true);
  };

  const handleConfirmRename = () => {
    if (onRename && editName.trim() && editName !== cat.name) {
      onRename(cat.id, editName.trim());
    }
    setIsEditing(false);
  };

  const handleCancelRename = () => {
    setEditName(cat.name);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleConfirmRename();
    } else if (e.key === 'Escape') {
      handleCancelRename();
    }
  };

  const generateRandomName = () => {
    const randomIndex = Math.floor(Math.random() * FUN_CAT_NAMES.length);
    setEditName(FUN_CAT_NAMES[randomIndex]);
  };
  
  const glowColor = reaction?.type === 'positive' 
    ? 'rgba(236, 72, 153, 0.4)' 
    : reaction?.type === 'negative' 
    ? 'rgba(239, 68, 68, 0.4)' 
    : undefined;
  const catRelationships = relationships.filter(r => r.catId1 === cat.id || r.catId2 === cat.id);
  const friends = catRelationships.filter(r => r.score >= 20);
  const enemies = catRelationships.filter(r => r.score <= -20);

  // Check if cat needs comforting (upset, angry, sad)
  const needsComfort = cat.happiness < 50 || enemies.length > friends.length || cat.health < 50;
  const moodEmoji = cat.happiness < 30 ? '😿' : cat.happiness < 50 ? '😾' : null;

  if (compact) {
    return (
      <div className="cat-card-compact">
        <CatAvatar cat={cat} size="sm" equippedCostumeId={equippedCostumeId} />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{cat.name}</p>
          <p className="text-xs text-muted-foreground">{breedInfo.name}</p>
        </div>
        <GradeBadge grade={cat.grade} size="sm" />
      </div>
    );
  }

  return (
    <div 
      className={`cat-card ${gradeBorder} ${!isHealthy ? 'border-destructive/50' : ''} ${reaction ? 'animate-card-glow' : ''} relative overflow-visible`}
      style={glowColor ? { '--glow-color': glowColor } as React.CSSProperties : undefined}
    >
      {reaction && <CatCardReaction reaction={reaction} />}
      <div className="flex items-start justify-between w-full mb-2">
        <div className="flex items-center gap-1">
          <CatAvatar cat={cat} size="md" equippedCostumeId={equippedCostumeId} animated />
          {moodEmoji && <span className="text-lg">{moodEmoji}</span>}
        </div>
        <GradeBadge grade={cat.grade} />
      </div>
      
      <div className="flex items-center gap-1 w-full group">
        {isEditing ? (
          <div className="flex items-center gap-1 flex-1">
            <Input
              ref={inputRef}
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={20}
              className="h-6 text-sm font-bold px-1 py-0 flex-1"
              onClick={(e) => e.stopPropagation()}
            />
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-5 w-5 text-purple-600 hover:bg-purple-100"
              onClick={(e) => { e.stopPropagation(); generateRandomName(); }}
              title="Generate random name"
            >
              <Shuffle className="h-3 w-3" />
            </Button>
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-5 w-5 text-green-600 hover:bg-green-100"
              onClick={(e) => { e.stopPropagation(); handleConfirmRename(); }}
            >
              <Check className="h-3 w-3" />
            </Button>
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-5 w-5 text-red-600 hover:bg-red-100"
              onClick={(e) => { e.stopPropagation(); handleCancelRename(); }}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <>
            <h3 className="font-bold text-foreground truncate">{cat.name}</h3>
            {onRename && (
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={handleStartEdit}
                title="Rename cat"
              >
                <Pencil className="h-3 w-3" />
              </Button>
            )}
          </>
        )}
      </div>
      <p className="text-xs text-muted-foreground mb-1">{breedInfo.name}</p>
      <p className="text-xs text-muted-foreground mb-2">
        {personalityEmojis[cat.personality]} {cat.personality}
      </p>

      {/* Relationship Badges */}
      {(friends.length > 0 || enemies.length > 0) && (
        <div className="flex gap-1 flex-wrap mb-2 w-full">
          {friends.length > 0 && (
            <Badge variant="outline" className="text-xs bg-green-50 text-green-600 border-green-200">
              💚 {friends.length}
            </Badge>
          )}
          {enemies.length > 0 && (
            <Badge variant="outline" className="text-xs bg-red-50 text-red-600 border-red-200">
              😾 {enemies.length}
            </Badge>
          )}
          {cat.tricksLearned.length > 0 && (
            <Badge variant="outline" className="text-xs bg-purple-50 text-purple-600 border-purple-200">
              🎯 {cat.tricksLearned.length} tricks
            </Badge>
          )}
        </div>
      )}
      
      <div className="w-full space-y-1.5 mb-3">
        <div className="stat-row">
          <span className="text-xs">❤️</span>
          <Progress value={cat.health} className={`h-1.5 flex-1 ${cat.health < 50 ? 'bg-destructive/20' : ''}`} />
        </div>
        <div className="stat-row">
          <span className="text-xs">😊</span>
          <Progress value={cat.happiness} className={`h-1.5 flex-1 ${cat.happiness < 50 ? 'bg-amber-500/30' : ''}`} />
        </div>
        <div className="stat-row">
          <span className="text-xs">🍖</span>
          <Progress value={cat.hunger} className={`h-1.5 flex-1 ${cat.hunger < 30 ? 'bg-amber-500/30' : ''}`} />
        </div>
      </div>
      
      <div className="flex items-center gap-2 w-full text-xs text-muted-foreground mb-2">
        {cat.showWins > 0 && <span>🏆 {cat.showWins}</span>}
        <span className="ml-auto font-medium text-primary">${cat.value}</span>
      </div>
      
      {/* Comfort button for upset cats */}
      {needsComfort && onComfort && (
        <div className="w-full mb-2">
          <ComfortButton catId={cat.id} catName={cat.name} onComfort={onComfort} />
        </div>
      )}
      
      <div className="flex gap-1 w-full">
        {!isHealthy && (
          <Button variant="outline" size="sm" onClick={() => onHeal(cat.id)} className="flex-1 text-xs">
            💊 Heal
          </Button>
        )}
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => onSell(cat.id)}
          className="flex-1 text-xs hover:bg-destructive/10 hover:text-destructive"
        >
          Sell
        </Button>
      </div>
    </div>
  );
}
