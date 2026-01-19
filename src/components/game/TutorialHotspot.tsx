import { cn } from '@/lib/utils';

interface TutorialHotspotProps {
  isActive: boolean;
  children: React.ReactNode;
  className?: string;
}

/**
 * Wraps an element to add a pulsing highlight effect when active.
 * Used during tutorial to draw attention to specific UI elements.
 */
export function TutorialHotspot({ isActive, children, className }: TutorialHotspotProps) {
  return (
    <div
      className={cn(
        'transition-all duration-300',
        isActive && 'tutorial-hotspot-active ring-2 ring-primary ring-offset-2 ring-offset-background rounded-md',
        className
      )}
    >
      {children}
    </div>
  );
}
