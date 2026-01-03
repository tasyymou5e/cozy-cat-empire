import { useState, useRef, useEffect } from 'react';
import { Cat, BREEDS, CatBreed, CatPersonality } from '@/types/game';
import { CatRelationship } from '@/types/relationships';
import { getGradeBorderClass, getGradeTier } from '@/types/grading';
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

const BREED_NAMES: Record<CatBreed, string[]> = {
  'siamese': ['Sakura', 'Miko', 'Yuki', 'Suki', 'Kiko', 'Hana', 'Wasabi', 'Tempura', 'Sake', 'Nori', 'Tofu', 'Mochi'],
  'persian': ['Duchess', 'Prince', 'Valentino', 'Anastasia', 'Cleopatra', 'Empress', 'Countess', 'Marquis', 'Vivienne', 'Reginald'],
  'maine-coon': ['Bear', 'Moose', 'Timber', 'Ranger', 'Hunter', 'Maple', 'Everest', 'Grizzly', 'Kodiak', 'Aspen', 'Summit'],
  'british-shorthair': ['Winston', 'Churchill', 'Wellington', 'Sherlock', 'Watson', 'Paddington', 'Biscuit', 'Earl Grey', 'Crumpet'],
  'ragdoll': ['Marshmallow', 'Velvet', 'Cashmere', 'Fluffernutter', 'Snuggles', 'Cloud', 'Pillow', 'Cottontail', 'Silky'],
  'bengal': ['Rajah', 'Sheba', 'Zara', 'Jungle', 'Safari', 'Tigris', 'Savanna', 'Leo', 'Panther', 'Aztec', 'Sahara'],
  'tabby': ['Stripes', 'Marble', 'Autumn', 'Caramel', 'Butterscotch', 'Toffee', 'Cinnamon', 'Tiger', 'Amber'],
  'stray': ['Scrappy', 'Lucky', 'Rascal', 'Scout', 'Maverick', 'Bandit', 'Dusty', 'Patches', 'Scruffy', 'Streetwise'],
};

const PERSONALITY_NAMES: Record<CatPersonality, string[]> = {
  'lazy': ['Snoozer', 'Dreamer', 'Sleepy', 'Cozy', 'Lounger', 'Napkin', 'Slumber', 'Dozer', 'Yawnie', 'Pillow'],
  'playful': ['Zoom', 'Bounce', 'Sparky', 'Frisky', 'Zippy', 'Turbo', 'Rocket', 'Dash', 'Peppy', 'Zinger'],
  'affectionate': ['Cuddles', 'Sweetie', 'Honey', 'Lovebug', 'Snugglepuff', 'Huggy', 'Smoochie', 'Darling', 'Angel'],
  'independent': ['Maverick', 'Solo', 'Rebel', 'Sphinx', 'Mystery', 'Enigma', 'Lone Wolf', 'Rogue', 'Drifter'],
  'curious': ['Scout', 'Explorer', 'Sherlock', 'Detective', 'Peepers', 'Nosy', 'Snoop', 'Inquisitor', 'Seeker'],
  'shy': ['Whisper', 'Shadow', 'Misty', 'Ghost', 'Phantom', 'Bashful', 'Wallflower', 'Timid', 'Hush'],
};

const UNIVERSAL_NAMES = [
  'Whiskers', 'Mittens', 'Luna', 'Oliver', 'Bella', 'Max', 'Coco',
  'Biscuit', 'Muffin', 'Cookie', 'Sir Fluffington', 'Lord Meowington',
  'Gandalf', 'Yoda', 'Dumbledore', 'Felix', 'Ginger', 'Pepper',
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
  const tier = getGradeTier(cat.grade);
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
    const breedNames = BREED_NAMES[cat.breed] || [];
    const personalityNames = PERSONALITY_NAMES[cat.personality] || [];
    const combinedNames = [...breedNames, ...personalityNames, ...UNIVERSAL_NAMES];
    const randomIndex = Math.floor(Math.random() * combinedNames.length);
    setEditName(combinedNames[randomIndex]);
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
      className={`cat-card ${gradeBorder} ${!isHealthy ? 'border-destructive/50' : ''} ${reaction ? 'animate-card-glow' : ''} relative overflow-visible transition-all duration-300`}
      style={glowColor ? { '--glow-color': glowColor } as React.CSSProperties : undefined}
    >
      {/* Ultra rare sparkle overlay */}
      {tier === 'ultraRare' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl z-10">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
        </div>
      )}
      {tier === 'ultraRare' && (
        <div className="absolute -inset-2 pointer-events-none z-0">
          {[...Array(6)].map((_, i) => (
            <span
              key={i}
              className="absolute text-sm animate-sparkle"
              style={{
                left: `${15 + (i * 14)}%`,
                top: `${10 + ((i % 3) * 35)}%`,
                animationDelay: `${i * 0.3}s`,
              }}
            >
              ✨
            </span>
          ))}
        </div>
      )}
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
