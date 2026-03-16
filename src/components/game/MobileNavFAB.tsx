import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useHaptics } from '@/hooks/useHaptics';

interface MobileNavFABProps {
  onOpenMenu: () => void;
  /** Optional: Show as expanded with label */
  expanded?: boolean;
  /** Optional: Custom label for expanded state */
  label?: string;
}

/**
 * Floating Action Button for mobile navigation on external pages
 * Provides a consistent way to access the navigation drawer/sidebar
 * on pages that don't have the main game's bottom bar
 */
export function MobileNavFAB({ 
  onOpenMenu, 
  expanded = false,
  label = 'Menu' 
}: MobileNavFABProps) {
  const { vibrate } = useHaptics();
  const [isPressed, setIsPressed] = useState(false);

  const handleClick = () => {
    vibrate('light');
    onOpenMenu();
  };

  const handleTouchStart = () => setIsPressed(true);
  const handleTouchEnd = () => setIsPressed(false);

  return (
    <button
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
      onMouseLeave={handleTouchEnd}
      className={cn(
        // Base styles
        'fixed z-50 flex items-center justify-center',
        'bg-primary text-primary-foreground shadow-lg',
        'transition-all duration-200 ease-out',
        'active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        // Position: bottom-right with safe area consideration
        'bottom-6 right-6 mb-safe z-50',
        // Size and shape
        expanded 
          ? 'h-12 px-4 gap-2 rounded-full' 
          : 'w-14 h-14 rounded-full',
        // Pressed state
        isPressed && 'scale-95 shadow-md',
        // Hidden on tablet/desktop
        'md:hidden'
      )}
      aria-label="Open navigation menu"
    >
      <Menu className="h-6 w-6" />
      {expanded && (
        <span className="font-medium text-sm">{label}</span>
      )}
    </button>
  );
}
