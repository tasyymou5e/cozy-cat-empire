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
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border safe-area-inset-bottom">
      <div className="flex items-center justify-between h-14 px-4">
        {/* Quick Stats */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-2 py-1 rounded bg-muted/50 text-sm">
            <span>📅</span>
            <span className="font-medium">{day}</span>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 rounded bg-muted/50 text-sm">
            <span>💰</span>
            <span className="font-bold text-gradient-gold">${money.toLocaleString()}</span>
          </div>
        </div>

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
