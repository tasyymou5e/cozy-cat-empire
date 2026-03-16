import { cn } from '@/lib/utils';
import { Menu } from 'lucide-react';
import { useHaptics } from '@/hooks/useHaptics';

interface MobileNavBarProps {
  activeTab: string;
  onOpenMenu: () => void;
  day: number;
  money: number;
}

/**
 * Fixed bottom navigation bar for mobile devices
 * Shows quick stats (Day, Money) and a Menu button to open the drawer
 */
export function MobileNavBar({
  activeTab,
  onOpenMenu,
  day,
  money,
}: MobileNavBarProps) {
  const { vibrate } = useHaptics();

  const handleOpenMenu = () => {
    vibrate('light');
    onOpenMenu();
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border pb-safe">
      <div className="flex items-center justify-between h-14 px-4">
        {/* Active tab label */}
        <span className="text-sm font-medium text-muted-foreground truncate max-w-[200px]">
          🐱 Cat Farm
        </span>

        {/* Menu Button - Touch-friendly size */}
        <button
          onClick={handleOpenMenu}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg',
            'bg-primary text-primary-foreground font-medium',
            'transition-all duration-150',
            'hover:bg-primary/90 active:scale-95',
            'touch-target min-h-[44px]'
          )}
        >
          <Menu className="h-5 w-5" />
          <span>Menu</span>
        </button>
      </div>
    </nav>
  );
}
