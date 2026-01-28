import { HouseSize } from '@/types/game';
import { TimeOfDay } from '@/types/empire';
import { ApartmentBackground } from './backgrounds/ApartmentBackground';
import { HouseBackground } from './backgrounds/HouseBackground';
import { MansionBackground } from './backgrounds/MansionBackground';
import { FarmBackground } from './backgrounds/FarmBackground';
import { cn } from '@/lib/utils';

interface EmpireBackgroundProps {
  houseSize: HouseSize;
  timeOfDay: TimeOfDay;
  className?: string;
}

/**
 * Renders the appropriate illustrated SVG background based on house type
 * Each background has layered elements (sky, walls, floor) that react to time of day
 */
export function EmpireBackground({ houseSize, timeOfDay, className }: EmpireBackgroundProps) {
  const backgrounds: Record<HouseSize, React.ComponentType<{ timeOfDay: TimeOfDay; className?: string }>> = {
    apartment: ApartmentBackground,
    house: HouseBackground,
    mansion: MansionBackground,
    farm: FarmBackground,
  };

  const BackgroundComponent = backgrounds[houseSize];

  return (
    <div className={cn('absolute inset-0 overflow-hidden', className)}>
      <BackgroundComponent timeOfDay={timeOfDay} className="w-full h-full" />
    </div>
  );
}
