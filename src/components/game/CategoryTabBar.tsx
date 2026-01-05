import { useState, useEffect, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'; // Used in category buttons
import { TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Users, User, Gift, ArrowLeftRight, Target, ListTodo, Dices, BookOpen, Scroll, Handshake } from 'lucide-react';

export interface CategoryDefinition {
  id: string;
  icon: string | React.ReactNode;
  label: string;
  description: string;
  tabs: TabDefinition[];
}

export interface TabDefinition {
  id: string;
  icon: string | React.ReactNode;
  label: string;
  description: string;
}

// Category definitions with their sub-tabs
export const CATEGORIES: CategoryDefinition[] = [
  {
    id: 'farm',
    icon: '🏠',
    label: 'Farm',
    description: 'Manage your farm and daily tasks',
    tabs: [
      { id: 'actions', icon: '🐾', label: 'Actions', description: 'Add cats, advance days' },
      { id: 'chores', icon: '🧹', label: 'Chores', description: 'Earn coins by doing chores' },
      { id: 'supplies', icon: '📦', label: 'Supplies', description: 'Buy food, medicine, toys' },
      { id: 'market', icon: '🛒', label: 'Market', description: 'Purchase cats from sellers' },
      { id: 'bulk', icon: '⚡', label: 'Bulk Actions', description: 'Mass actions for all cats' },
    ],
  },
  {
    id: 'cats',
    icon: '🐱',
    label: 'Cats',
    description: 'Breeding, training, and customization',
    tabs: [
      { id: 'breeding', icon: '💕', label: 'Breeding', description: 'Pair cats to create kittens' },
      { id: 'training', icon: '💪', label: 'Training', description: 'Teach tricks, rest cats' },
      { id: 'costumes', icon: '👗', label: 'Costumes', description: 'Dress up your cats' },
      { id: 'specializations', icon: '✨', label: 'Specializations', description: 'Specialize cats for bonuses' },
    ],
  },
  {
    id: 'social',
    icon: '👥',
    label: 'Social',
    description: 'Friends, gifts, and trading',
    tabs: [
      { id: 'social', icon: '🤝', label: 'Socialize', description: 'Build cat relationships' },
      { id: 'friends', icon: <Users className="h-4 w-4" />, label: 'Friends', description: 'Manage player friends' },
      { id: 'gifts', icon: <Gift className="h-4 w-4" />, label: 'Gifts', description: 'Send and receive cat gifts' },
      { id: 'trading', icon: <ArrowLeftRight className="h-4 w-4" />, label: 'Trading', description: 'Trade cats with players' },
      { id: 'coop', icon: <Handshake className="h-4 w-4" />, label: 'Co-op', description: 'Cooperative challenges' },
    ],
  },
  {
    id: 'progress',
    icon: '📈',
    label: 'Progress',
    description: 'Challenges, achievements, and rewards',
    tabs: [
      { id: 'leaderboard', icon: '🏆', label: 'Leaderboard', description: 'Cat rankings' },
      { id: 'challenges', icon: <Target className="h-4 w-4" />, label: 'Challenges', description: 'Weekly challenges' },
      { id: 'objectives', icon: <ListTodo className="h-4 w-4" />, label: 'Objectives', description: 'Daily tasks' },
      { id: 'battlepass', icon: <Scroll className="h-4 w-4" />, label: 'Season Pass', description: 'Season pass rewards' },
      { id: 'collection', icon: <BookOpen className="h-4 w-4" />, label: 'Collection', description: 'Track collection progress' },
      { id: 'legacy', icon: '👑', label: 'Hall of Fame', description: 'Retired legendary cats' },
      { id: 'wheel', icon: <Dices className="h-4 w-4" />, label: 'Lucky Wheel', description: 'Spin for prizes' },
    ],
  },
  {
    id: 'settings',
    icon: '⚙️',
    label: 'Settings',
    description: 'Profile and game settings',
    tabs: [
      { id: 'profile', icon: <User className="h-4 w-4" />, label: 'Profile', description: 'Edit your profile' },
      { id: 'more', icon: '⚙️', label: 'Settings', description: 'Achievements, graphics, save/load' },
    ],
  },
];

// Get category for a tab
export function getCategoryForTab(tabId: string): string {
  for (const category of CATEGORIES) {
    if (category.tabs.some(tab => tab.id === tabId)) {
      return category.id;
    }
  }
  return 'farm';
}

// Get all tab IDs
export function getAllTabIds(): string[] {
  return CATEGORIES.flatMap(cat => cat.tabs.map(tab => tab.id));
}

interface CategoryTabBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  highlightedTab?: string | null;
  badges: Record<string, number>;
}

export function CategoryTabBar({ activeTab, onTabChange, highlightedTab, badges }: CategoryTabBarProps) {
  const isMobile = useIsMobile();
  const [activeCategory, setActiveCategory] = useState(() => getCategoryForTab(activeTab));
  
  // Remember last visited tab per category in localStorage
  const [lastTabPerCategory, setLastTabPerCategory] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('cat-farm-last-tab-per-category');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Update active category when tab changes externally
  useEffect(() => {
    const category = getCategoryForTab(activeTab);
    setActiveCategory(category);
    
    // Save last visited tab for this category
    setLastTabPerCategory(prev => {
      const updated = { ...prev, [category]: activeTab };
      localStorage.setItem('cat-farm-last-tab-per-category', JSON.stringify(updated));
      return updated;
    });
  }, [activeTab]);

  // Calculate aggregate badge count per category
  const categoryBadges = useMemo(() => {
    const result: Record<string, number> = {};
    for (const category of CATEGORIES) {
      let total = 0;
      for (const tab of category.tabs) {
        total += badges[tab.id] || 0;
      }
      result[category.id] = total;
    }
    return result;
  }, [badges]);

  // Get current category's tabs
  const currentCategory = CATEGORIES.find(c => c.id === activeCategory) || CATEGORIES[0];

  const handleCategoryClick = (categoryId: string) => {
    setActiveCategory(categoryId);
    // Switch to last visited tab in this category, or first tab
    const category = CATEGORIES.find(c => c.id === categoryId);
    if (category) {
      const lastTab = lastTabPerCategory[categoryId] || category.tabs[0].id;
      onTabChange(lastTab);
    }
  };

  return (
    <div className="w-full">
      {/* Category Bar */}
      <TooltipProvider delayDuration={300}>
        <div className="flex justify-center gap-1 sm:gap-2 mb-2">
          {CATEGORIES.map((category) => {
            const isActive = category.id === activeCategory;
            const badgeCount = categoryBadges[category.id];
            
            return (
              <Tooltip key={category.id}>
                <TooltipTrigger asChild>
                  <Button
                    variant={isActive ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => handleCategoryClick(category.id)}
                    className={cn(
                      'relative flex items-center gap-1 min-w-10 min-h-10 px-2 sm:px-3 transition-all',
                      isActive && 'shadow-md'
                    )}
                  >
                    <span className="text-base">{typeof category.icon === 'string' ? category.icon : category.icon}</span>
                    {!isMobile && <span className="text-xs font-medium hidden sm:inline">{category.label}</span>}
                    {badgeCount > 0 && (
                      <Badge 
                        variant="destructive" 
                        className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[10px] flex items-center justify-center"
                      >
                        {badgeCount > 9 ? '9+' : badgeCount}
                      </Badge>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-center">
                    <div className="font-medium">{category.label}</div>
                    <div className="text-xs text-muted-foreground">{category.description}</div>
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>

      {/* Sub-tabs for current category */}
      <div className="flex justify-center gap-1 p-1 bg-muted/50 rounded-lg overflow-x-auto scrollbar-hide">
        {currentCategory.tabs.map((tab) => {
          const isHighlighted = tab.id === highlightedTab;
          const badgeCount = badges[tab.id] || 0;

          return (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              onClick={() => onTabChange(tab.id)}
              title={`${tab.label}: ${tab.description}`}
              className={cn(
                'relative flex-shrink-0 min-w-10 min-h-10 text-base px-3 transition-all',
                isHighlighted && 'ring-2 ring-primary animate-pulse'
              )}
            >
              <span className="flex items-center gap-1.5">
                {typeof tab.icon === 'string' ? (
                  <span>{tab.icon}</span>
                ) : (
                  tab.icon
                )}
                {!isMobile && <span className="text-xs hidden sm:inline">{tab.label}</span>}
              </span>
              {badgeCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary rounded-full text-[10px] flex items-center justify-center text-primary-foreground">
                  {badgeCount > 9 ? '9+' : badgeCount}
                </span>
              )}
            </TabsTrigger>
          );
        })}
      </div>
    </div>
  );
}
