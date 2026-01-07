import { Link } from 'react-router-dom';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { ChevronDown, BarChart3, LayoutGrid, Heart, Camera, Image, Globe } from 'lucide-react';
import { CATEGORIES, getCategoryForTab } from './CategoryTabBar';

interface MobileGameDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  badges: Record<string, number>;
  day: number;
  money: number;
}

const EXTERNAL_LINKS = [
  { href: '/stats', icon: <BarChart3 className="h-5 w-5" />, label: 'My Stats' },
  { href: '/collection', icon: <LayoutGrid className="h-5 w-5" />, label: 'Cat Collection' },
  { href: '/relationships', icon: <Heart className="h-5 w-5" />, label: 'Cat Relationships' },
  { href: '/photobooth', icon: <Camera className="h-5 w-5" />, label: 'Photo Booth' },
  { href: '/gallery', icon: <Image className="h-5 w-5" />, label: 'Photo Gallery' },
  { href: '/leaderboard', icon: <Globe className="h-5 w-5" />, label: 'Global Leaderboard' },
];

export function MobileGameDrawer({
  open,
  onOpenChange,
  activeTab,
  onTabChange,
  badges,
  day,
  money,
}: MobileGameDrawerProps) {
  const activeCategory = getCategoryForTab(activeTab);

  const handleTabClick = (tabId: string) => {
    onTabChange(tabId);
    onOpenChange(false);
  };

  // Calculate badge counts per category
  const getCategoryBadgeCount = (categoryId: string) => {
    const category = CATEGORIES.find((c) => c.id === categoryId);
    if (!category) return 0;
    return category.tabs.reduce((sum, tab) => sum + (badges[tab.id] || 0), 0);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="pb-2">
          <DrawerTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              🐱 Navigation
            </span>
            <div className="flex items-center gap-2 text-sm font-normal">
              <span className="px-2 py-0.5 rounded bg-muted">📅 Day {day}</span>
              <span className="px-2 py-0.5 rounded bg-muted text-gradient-gold font-medium">💰 ${money}</span>
            </div>
          </DrawerTitle>
        </DrawerHeader>

        <ScrollArea className="flex-1 px-4 pb-8">
          <div className="space-y-2">
            {/* Categories with accordion */}
            {CATEGORIES.map((category) => {
              const isActiveCategory = category.id === activeCategory;
              const categoryBadge = getCategoryBadgeCount(category.id);

              return (
                <Collapsible
                  key={category.id}
                  defaultOpen={isActiveCategory}
                  className="border border-border rounded-lg overflow-hidden"
                >
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">
                        {typeof category.icon === 'string' ? category.icon : category.icon}
                      </span>
                      <span className="font-medium">{category.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {categoryBadge > 0 && (
                        <Badge variant="destructive" className="h-5 min-w-5 px-1.5 text-xs">
                          {categoryBadge > 9 ? '9+' : categoryBadge}
                        </Badge>
                      )}
                      <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                    </div>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className="grid grid-cols-3 gap-2 p-2">
                      {category.tabs.map((tab) => {
                        const isActive = tab.id === activeTab;
                        const tabBadge = badges[tab.id] || 0;

                        return (
                          <button
                            key={tab.id}
                            onClick={() => handleTabClick(tab.id)}
                            className={cn(
                              'relative flex flex-col items-center justify-center p-3 rounded-lg border transition-all',
                              isActive
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'bg-background border-border hover:bg-muted'
                            )}
                          >
                            <span className="text-lg mb-1">
                              {typeof tab.icon === 'string' ? tab.icon : tab.icon}
                            </span>
                            <span className="text-[11px] font-medium text-center leading-tight">
                              {tab.label}
                            </span>
                            {tabBadge > 0 && (
                              <Badge
                                variant={isActive ? 'secondary' : 'destructive'}
                                className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[10px]"
                              >
                                {tabBadge > 9 ? '9+' : tabBadge}
                              </Badge>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}

            <Separator className="my-4" />

            {/* External Pages */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-2 px-1">Pages</h3>
              <div className="grid grid-cols-2 gap-2">
                {EXTERNAL_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    onClick={() => onOpenChange(false)}
                    className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border hover:bg-muted transition-colors"
                  >
                    {link.icon}
                    <span className="text-sm font-medium">{link.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
      </DrawerContent>
    </Drawer>
  );
}
