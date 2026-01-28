import { WindowSceneType, TimeOfDay } from '@/types/empire';
import { cn } from '@/lib/utils';

interface WindowSceneProps {
  type: WindowSceneType;
  timeOfDay: TimeOfDay;
  className?: string;
}

/**
 * Scene configurations for each window view type
 */
const WINDOW_SCENES: Record<WindowSceneType, {
  elements: Array<{ emoji: string; x: number; y: number; size: string }>;
  gradient: { light: string; dark: string };
  name: string;
}> = {
  city: {
    name: 'City Skyline',
    elements: [
      { emoji: '🏢', x: 20, y: 60, size: 'text-2xl' },
      { emoji: '🏙️', x: 50, y: 55, size: 'text-3xl' },
      { emoji: '🏢', x: 75, y: 62, size: 'text-xl' },
      { emoji: '🌆', x: 35, y: 58, size: 'text-2xl' },
    ],
    gradient: {
      light: 'from-sky-400 via-sky-300 to-orange-200',
      dark: 'from-indigo-900 via-purple-900 to-slate-900',
    },
  },
  garden: {
    name: 'Garden View',
    elements: [
      { emoji: '🌳', x: 15, y: 55, size: 'text-3xl' },
      { emoji: '🌸', x: 40, y: 65, size: 'text-xl' },
      { emoji: '🌳', x: 70, y: 58, size: 'text-2xl' },
      { emoji: '🦋', x: 55, y: 45, size: 'text-lg' },
      { emoji: '🌷', x: 85, y: 68, size: 'text-lg' },
    ],
    gradient: {
      light: 'from-sky-300 via-sky-200 to-green-200',
      dark: 'from-slate-800 via-emerald-900 to-green-950',
    },
  },
  mountains: {
    name: 'Mountain Vista',
    elements: [
      { emoji: '🏔️', x: 30, y: 50, size: 'text-4xl' },
      { emoji: '⛰️', x: 60, y: 55, size: 'text-3xl' },
      { emoji: '🌲', x: 15, y: 70, size: 'text-xl' },
      { emoji: '🌲', x: 85, y: 68, size: 'text-xl' },
      { emoji: '🦅', x: 45, y: 35, size: 'text-lg' },
    ],
    gradient: {
      light: 'from-sky-400 via-sky-300 to-slate-300',
      dark: 'from-slate-900 via-blue-950 to-slate-800',
    },
  },
  fields: {
    name: 'Rolling Fields',
    elements: [
      { emoji: '🌾', x: 20, y: 65, size: 'text-2xl' },
      { emoji: '🌻', x: 45, y: 60, size: 'text-xl' },
      { emoji: '🌾', x: 70, y: 68, size: 'text-2xl' },
      { emoji: '🐄', x: 85, y: 72, size: 'text-lg' },
      { emoji: '☁️', x: 30, y: 25, size: 'text-xl' },
      { emoji: '☁️', x: 65, y: 20, size: 'text-lg' },
    ],
    gradient: {
      light: 'from-sky-300 via-sky-200 to-lime-200',
      dark: 'from-slate-800 via-green-950 to-lime-950',
    },
  },
};

/**
 * Time-based gradient modifiers
 */
function getTimeGradient(timeOfDay: TimeOfDay, baseGradient: { light: string; dark: string }) {
  switch (timeOfDay) {
    case 'morning':
      return baseGradient.light.replace('sky-400', 'amber-200').replace('sky-300', 'orange-100');
    case 'evening':
      return baseGradient.light.replace('sky-400', 'orange-400').replace('sky-300', 'pink-300');
    case 'night':
      return baseGradient.dark;
    default:
      return baseGradient.light;
  }
}

/**
 * Renders the view through a window based on scene type and time of day
 */
export function WindowScene({ type, timeOfDay, className }: WindowSceneProps) {
  const scene = WINDOW_SCENES[type];
  const gradient = getTimeGradient(timeOfDay, scene.gradient);
  const isNight = timeOfDay === 'night';

  return (
    <div 
      className={cn(
        'absolute rounded-lg overflow-hidden border-4 border-stone-400/30 dark:border-stone-600/30',
        'shadow-inner',
        className
      )}
      style={{
        width: '25%',
        height: '35%',
        left: '50%',
        top: '8%',
        transform: 'translateX(-50%)',
      }}
      aria-label={`Window view: ${scene.name}`}
    >
      {/* Sky gradient background */}
      <div className={cn(
        'absolute inset-0 bg-gradient-to-b transition-colors duration-1000',
        gradient
      )} />

      {/* Scene elements */}
      {scene.elements.map((element, i) => (
        <span
          key={i}
          className={cn(
            'absolute transition-opacity duration-500',
            element.size,
            isNight && 'opacity-60'
          )}
          style={{
            left: `${element.x}%`,
            top: `${element.y}%`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          {element.emoji}
        </span>
      ))}

      {/* Sun/Moon based on time */}
      <span 
        className="absolute text-2xl"
        style={{
          right: '10%',
          top: '15%',
        }}
      >
        {isNight ? '🌙' : timeOfDay === 'evening' ? '🌅' : '☀️'}
      </span>

      {/* Window frame overlay */}
      <div className="absolute inset-0 border-2 border-stone-300/50 dark:border-stone-600/50 rounded pointer-events-none" />
      
      {/* Window reflection */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent pointer-events-none"
        style={{ mixBlendMode: 'overlay' }}
      />
    </div>
  );
}

export default WindowScene;
