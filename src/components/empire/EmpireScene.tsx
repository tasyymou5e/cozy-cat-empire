import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Cat, HouseSize, GameState } from '@/types/game';
import { EmpireInteraction } from '@/types/empire';
import { EMPIRE_ZONES } from '@/config/empire';
import { useRoamingCats } from '@/hooks/empire/useRoamingCats';
import { useCatReactions } from '@/contexts/CatReactionContext';
import { useSound, SoundType } from '@/contexts/SoundContext';
import { RoamingCat } from './RoamingCat';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface EmpireSceneProps {
  cats: Cat[];
  houseSize: HouseSize;
  catCostumes: Record<string, string>;
  resources: GameState['resources'];
  onPetCat: (catId: string) => void;
  onFeedCat: (catId: string) => void;
  onPlayWithCat: (catId: string) => void;
}

/**
 * Main Empire scene container
 * Renders the dwelling background and all roaming cats
 */
export function EmpireScene({
  cats,
  houseSize,
  catCostumes,
  resources,
  onPetCat,
  onFeedCat,
  onPlayWithCat,
}: EmpireSceneProps) {
  const navigate = useNavigate();
  const { playSound } = useSound();
  const { addReaction } = useCatReactions();
  const { positions, setInteracting } = useRoamingCats(cats);

  const zone = EMPIRE_ZONES[houseSize];

  const handleInteraction = useCallback((catId: string, action: EmpireInteraction) => {
    setInteracting(catId);

    switch (action) {
      case 'pet':
        playSound('purr');
        addReaction(catId, 'positive');
        onPetCat(catId);
        break;
      case 'feed':
        if (resources.food > 0) {
          playSound('catEating');
          addReaction(catId, 'positive');
          onFeedCat(catId);
        }
        break;
      case 'play':
        if (resources.toys > 0) {
          playSound('catPlaying');
          addReaction(catId, 'positive');
          onPlayWithCat(catId);
        }
        break;
      case 'photobooth':
        navigate(`/photobooth/${catId}`);
        break;
      case 'details':
        navigate(`/customize/${catId}`);
        break;
    }
  }, [playSound, addReaction, setInteracting, onPetCat, onFeedCat, onPlayWithCat, resources, navigate]);

  return (
    <div className="relative w-full h-[500px] sm:h-[600px] overflow-hidden rounded-xl border border-border shadow-lg">
      {/* Wall/Background area (top 50%) */}
      <div 
        className={cn(
          'absolute inset-0 bottom-1/2',
          zone.backgroundClass
        )}
      >
        {/* Wall decorations for mansion/farm */}
        {zone.wallDecoration && (
          <div className="absolute inset-0 flex items-center justify-center opacity-10 text-8xl">
            {zone.wallDecoration}
          </div>
        )}
      </div>

      {/* Floor area (bottom 50%) */}
      <div 
        className={cn(
          'absolute inset-0 top-1/2',
          zone.floorClass
        )}
        style={zone.floorPattern ? { backgroundImage: zone.floorPattern } : undefined}
      />

      {/* Gradient transition between wall and floor */}
      <div 
        className="absolute left-0 right-0 top-[48%] h-8 bg-gradient-to-b from-transparent via-black/5 to-transparent pointer-events-none"
      />

      {/* Roaming cats */}
      {cats.map((cat) => {
        const position = positions.get(cat.id);
        if (!position) return null;

        return (
          <RoamingCat
            key={cat.id}
            cat={cat}
            position={position}
            equippedCostumeId={catCostumes[cat.id]}
            onInteract={handleInteraction}
            canFeed={resources.food > 0}
            canPlay={resources.toys > 0}
          />
        );
      })}

      {/* Empty state */}
      {cats.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <span className="text-6xl mb-4 block">🏠</span>
            <p className="text-muted-foreground">No cats yet!</p>
            <p className="text-sm text-muted-foreground">Adopt some cats to see them roam around.</p>
          </div>
        </div>
      )}

      {/* Overlay stats */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <Badge variant="secondary" className="bg-background/80 backdrop-blur">
          🐱 {cats.length} cats
        </Badge>
        <Badge variant="secondary" className="bg-background/80 backdrop-blur">
          {zone.name}
        </Badge>
      </div>

      {/* Resource indicators */}
      <div className="absolute bottom-4 left-4 flex gap-2">
        <Badge variant="outline" className="bg-background/80 backdrop-blur">
          🥫 {resources.food}
        </Badge>
        <Badge variant="outline" className="bg-background/80 backdrop-blur">
          🧸 {resources.toys}
        </Badge>
      </div>
    </div>
  );
}
