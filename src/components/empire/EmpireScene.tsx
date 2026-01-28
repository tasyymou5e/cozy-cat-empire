import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Cat, HouseSize, GameState } from '@/types/game';
import { EmpireInteraction } from '@/types/empire';
import { ENHANCED_EMPIRE_ZONES } from '@/config/empire';
import { useRoamingCats } from '@/hooks/empire/useRoamingCats';
import { useParallax } from '@/hooks/empire/useParallax';
import { useGraphicsSettings } from '@/hooks/useGraphicsSettings';
import { useCatReactions } from '@/contexts/CatReactionContext';
import { useSound } from '@/contexts/SoundContext';
import { getCurrentRealSeason } from '@/lib/seasonUtils';
import { getTimeOfDay } from '@/lib/empireTimeOfDay';
import { RoamingCat } from './RoamingCat';
import { EmpirePropComponent } from './EmpirePropComponent';
import { WindowScene } from './WindowScene';
import { TimeOfDayOverlay } from './TimeOfDayOverlay';
import { SeasonalDecorations } from './SeasonalDecorations';
import { EmpireParticles } from './EmpireParticles';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface EmpireSceneProps {
  cats: Cat[];
  houseSize: HouseSize;
  catCostumes: Record<string, string>;
  resources: GameState['resources'];
  gameDay?: number;
  onPetCat: (catId: string) => void;
  onFeedCat: (catId: string) => void;
  onPlayWithCat: (catId: string) => void;
}

/**
 * Main Empire scene container
 * Renders the dwelling background with all visual layers and roaming cats
 */
export function EmpireScene({
  cats,
  houseSize,
  catCostumes,
  resources,
  gameDay = 1,
  onPetCat,
  onFeedCat,
  onPlayWithCat,
}: EmpireSceneProps) {
  const navigate = useNavigate();
  const { playSound } = useSound();
  const { addReaction } = useCatReactions();
  const { settings, effectiveAnimations } = useGraphicsSettings();
  
  // Get zone configuration
  const zone = ENHANCED_EMPIRE_ZONES[houseSize];
  
  // Season and time of day
  const season = getCurrentRealSeason();
  const timeOfDay = getTimeOfDay(gameDay);
  
  // Parallax effect (respects animation settings)
  const parallaxOffset = useParallax(effectiveAnimations && settings.enableEmpireParallax);
  
  // Roaming cats with prop attraction
  const { positions, setInteracting } = useRoamingCats(cats, zone.props);

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

  const handlePropClick = useCallback((propId: string) => {
    // Optional: Handle prop clicks (e.g., highlight, info popup)
    console.log('Prop clicked:', propId);
  }, []);

  return (
    <div className="relative w-full h-[500px] sm:h-[600px] overflow-hidden rounded-xl border border-border shadow-lg">
      {/* Layer 0: Sky/Background */}
      <div 
        className={cn(
          'absolute inset-0',
          `bg-gradient-to-b ${zone.skyGradient}`
        )}
        style={{
          transform: `translate(${parallaxOffset.x * 0.2}px, ${parallaxOffset.y * 0.2}px)`,
        }}
      >
        {/* Window scene for indoor zones */}
        {zone.windowScene && (
          <WindowScene 
            type={zone.windowScene} 
            timeOfDay={timeOfDay} 
          />
        )}
        
        {/* Wall decorations */}
        {zone.wallDecorations.map((deco, i) => (
          <span
            key={`wall-${i}`}
            className="absolute text-xl opacity-70"
            style={{
              left: `${deco.position.x}%`,
              top: `${deco.position.y}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            {deco.emoji}
          </span>
        ))}
      </div>

      {/* Layer 1: Wall area (top half) */}
      <div 
        className={cn(
          'absolute inset-0 bottom-1/2',
          `bg-gradient-to-b ${zone.wallGradient}`
        )}
        style={{
          transform: `translate(${parallaxOffset.x * 0.3}px, ${parallaxOffset.y * 0.3}px)`,
        }}
      />

      {/* Gradient transition between wall and floor */}
      <div 
        className="absolute left-0 right-0 top-[48%] h-8 bg-gradient-to-b from-transparent via-black/5 to-transparent pointer-events-none"
        style={{ zIndex: 5 }}
      />

      {/* Layer 2: Props (furniture/decorations) */}
      {zone.props.map(prop => (
        <EmpirePropComponent 
          key={prop.id} 
          prop={prop} 
          onClick={handlePropClick}
          parallaxOffset={parallaxOffset}
        />
      ))}

      {/* Layer 3: Floor area (bottom half) + Cats */}
      <div 
        className={cn(
          'absolute inset-0 top-1/2',
          `bg-gradient-to-b ${zone.floorGradient}`
        )}
        style={{ 
          backgroundImage: zone.floorPattern,
          transform: `translate(${parallaxOffset.x * 0.5}px, ${parallaxOffset.y * 0.5}px)`,
        }}
      >
        {/* Floor decorations */}
        {zone.floorDecorations.map((deco, i) => (
          <span
            key={`floor-${i}`}
            className="absolute text-lg opacity-60"
            style={{
              left: `${deco.position.x}%`,
              top: `${deco.position.y - 50}%`, // Adjust for floor positioning
              transform: 'translate(-50%, -50%)',
            }}
          >
            {deco.emoji}
          </span>
        ))}
      </div>

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

      {/* Layer 4: Atmospheric overlays */}
      {settings.enableTimeOfDayEffects && (
        <TimeOfDayOverlay gameDay={gameDay} />
      )}
      
      {settings.enableSeasonalDecorations && (
        <SeasonalDecorations season={season} houseSize={houseSize} />
      )}
      
      {zone.particles && settings.enableParticles && settings.enableEmpireParticles && (
        <EmpireParticles 
          type={zone.particles} 
          enableReducedMotion={settings.enableReducedMotion}
          density="light"
        />
      )}

      {/* Empty state */}
      {cats.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center z-40">
          <div className="text-center bg-background/80 backdrop-blur-sm rounded-lg p-6">
            <span className="text-6xl mb-4 block">🏠</span>
            <p className="text-muted-foreground font-medium">No cats yet!</p>
            <p className="text-sm text-muted-foreground">Adopt some cats to see them roam around.</p>
          </div>
        </div>
      )}

      {/* Layer 5: UI Overlays */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-50">
        <Badge variant="secondary" className="bg-background/80 backdrop-blur shadow-sm">
          🐱 {cats.length} cats
        </Badge>
        <Badge variant="secondary" className="bg-background/80 backdrop-blur shadow-sm">
          {zone.name}
        </Badge>
        <Badge variant="outline" className="bg-background/80 backdrop-blur shadow-sm text-xs">
          {timeOfDay === 'morning' ? '🌅' : 
           timeOfDay === 'afternoon' ? '☀️' : 
           timeOfDay === 'evening' ? '🌆' : '🌙'} 
          {' '}{timeOfDay.charAt(0).toUpperCase() + timeOfDay.slice(1)}
        </Badge>
      </div>

      {/* Resource indicators */}
      <div className="absolute bottom-4 left-4 flex gap-2 z-50">
        <Badge variant="outline" className="bg-background/80 backdrop-blur shadow-sm">
          🥫 {resources.food}
        </Badge>
        <Badge variant="outline" className="bg-background/80 backdrop-blur shadow-sm">
          🧸 {resources.toys}
        </Badge>
      </div>
    </div>
  );
}
