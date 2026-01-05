import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Menu } from 'lucide-react';

interface MobileBottomNavProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  onOpenMenu: () => void;
  badges: Record<string, number>;
}

const MOBILE_CATEGORIES = [
  { id: 'farm', icon: '🏠', label: 'Farm' },
  { id: 'cats', icon: '🐱', label: 'Cats' },
  { id: 'social', icon: '👥', label: 'Social' },
  { id: 'progress', icon: '📈', label: 'Progress' },
];

export function MobileBottomNav({ 
  activeCategory, 
  onCategoryChange, 
  onOpenMenu,
  badges 
}: MobileBottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border">
      <div className="flex items-center justify-around h-16 px-2 safe-area-inset-bottom">
        {MOBILE_CATEGORIES.map((category) => {
          const isActive = category.id === activeCategory;
          const badgeCount = badges[category.id] || 0;

          return (
            <button
              key={category.id}
              onClick={() => onCategoryChange(category.id)}
              className={cn(
                'relative flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <span className="text-xl">{category.icon}</span>
              <span className="text-[10px] font-medium">{category.label}</span>
              {badgeCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute top-1 right-1/4 h-4 min-w-4 px-1 text-[10px] flex items-center justify-center"
                >
                  {badgeCount > 9 ? '9+' : badgeCount}
                </Badge>
              )}
            </button>
          );
        })}

        {/* More Menu Button */}
        <button
          onClick={onOpenMenu}
          className="relative flex flex-col items-center justify-center flex-1 h-full gap-0.5 text-muted-foreground hover:text-foreground transition-colors"
        >
          <Menu className="h-5 w-5" />
          <span className="text-[10px] font-medium">More</span>
        </button>
      </div>
    </nav>
  );
}
