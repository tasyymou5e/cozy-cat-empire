import { Badge } from '@/components/ui/badge';
import { PrefetchLink } from '@/components/PrefetchLink';
import { Separator } from '@/components/ui/separator';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { ChevronDown, BarChart3, LayoutGrid, Heart, Camera, Image, Globe, Castle, Lock } from 'lucide-react';
import { CATEGORIES, getCategoryForTab } from './CategoryTabBar';

interface GameSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  badges: Record<string, number>;
  day: number;
  money: number;
  highlightedTab?: string | null;
  isTabUnlocked?: (tabId: string) => boolean;
  getTabUnlockHint?: (tabId: string) => string | null;
}

const EXTERNAL_LINKS = [
  { href: '/empire', icon: <Castle className="h-4 w-4" />, label: 'My Empire' },
  { href: '/stats', icon: <BarChart3 className="h-4 w-4" />, label: 'My Stats' },
  { href: '/collection', icon: <LayoutGrid className="h-4 w-4" />, label: 'Collection' },
  { href: '/relationships', icon: <Heart className="h-4 w-4" />, label: 'Relationships' },
  { href: '/photobooth', icon: <Camera className="h-4 w-4" />, label: 'Photo Booth' },
  { href: '/gallery', icon: <Image className="h-4 w-4" />, label: 'Gallery' },
  { href: '/leaderboard', icon: <Globe className="h-4 w-4" />, label: 'Leaderboard' },
];

export function GameSidebar({
  activeTab,
  onTabChange,
  badges,
  day,
  money,
  highlightedTab,
  isTabUnlocked,
  getTabUnlockHint,
}: GameSidebarProps) {
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';
  const activeCategory = getCategoryForTab(activeTab);

  // Calculate badge counts per category
  const getCategoryBadgeCount = (categoryId: string) => {
    const category = CATEGORIES.find((c) => c.id === categoryId);
    if (!category) return 0;
    return category.tabs.reduce((sum, tab) => sum + (badges[tab.id] || 0), 0);
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarHeader className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🐱</span>
            {!isCollapsed && (
              <span className="font-bold text-lg text-gradient-primary">Cat Farm</span>
            )}
          </div>
          <SidebarTrigger className="h-8 w-8" />
        </div>
        
        {/* Quick Stats - visible when expanded */}
        {!isCollapsed && (
          <div className="flex gap-3 mt-3 text-sm">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/50">
              <span>📅</span>
              <span className="font-medium">Day {day}</span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/50">
              <span>💰</span>
              <span className="font-medium text-gradient-gold">${money}</span>
            </div>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="px-2">
        {/* Navigation Categories */}
        {CATEGORIES.map((category) => {
          const isActiveCategory = category.id === activeCategory;
          const categoryBadge = getCategoryBadgeCount(category.id);

          return (
            <Collapsible
              key={category.id}
              defaultOpen={isActiveCategory}
              className="group/collapsible"
            >
              <SidebarGroup>
                <CollapsibleTrigger asChild>
                  <SidebarGroupLabel
                    className={cn(
                      'flex items-center justify-between cursor-pointer hover:bg-muted/50 rounded-md px-2 py-1.5 transition-colors',
                      isActiveCategory && 'bg-muted'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">
                        {typeof category.icon === 'string' ? category.icon : category.icon}
                      </span>
                      {!isCollapsed && (
                        <span className="font-medium">{category.label}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {categoryBadge > 0 && (
                        <Badge
                          variant="destructive"
                          className="h-4 min-w-4 px-1 text-[10px]"
                        >
                          {categoryBadge > 9 ? '9+' : categoryBadge}
                        </Badge>
                      )}
                      {!isCollapsed && (
                        <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                      )}
                    </div>
                  </SidebarGroupLabel>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {category.tabs.map((tab) => {
                        const isActive = tab.id === activeTab;
                        const tabBadge = badges[tab.id] || 0;
                        const isHighlighted = tab.id === highlightedTab;
                        const locked = isTabUnlocked ? !isTabUnlocked(tab.id) : false;
                        const hint = locked && getTabUnlockHint ? getTabUnlockHint(tab.id) : null;

                        return (
                          <SidebarMenuItem key={tab.id}>
                            <TooltipProvider delayDuration={200}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <SidebarMenuButton
                                    isActive={isActive && !locked}
                                    onClick={() => !locked && onTabChange(tab.id)}
                                    tooltip={isCollapsed ? tab.label : undefined}
                                    className={cn(
                                      'w-full justify-start gap-2 transition-colors',
                                      isActive && !locked && 'bg-primary text-primary-foreground hover:bg-primary/90',
                                      isHighlighted && !isActive && 'tutorial-hotspot-active ring-2 ring-primary ring-offset-2 ring-offset-background',
                                      locked && 'opacity-50 cursor-not-allowed'
                                    )}
                                  >
                                    <span className="text-sm shrink-0">
                                      {locked ? <Lock className="h-3.5 w-3.5" /> : (typeof tab.icon === 'string' ? tab.icon : tab.icon)}
                                    </span>
                                    {!isCollapsed && (
                                      <>
                                        <span className={cn('flex-1 text-left', locked && 'line-through')}>{tab.label}</span>
                                        {!locked && tabBadge > 0 && (
                                          <Badge
                                            variant={isActive ? 'secondary' : 'destructive'}
                                            className="h-4 min-w-4 px-1 text-[10px]"
                                          >
                                            {tabBadge > 9 ? '9+' : tabBadge}
                                          </Badge>
                                        )}
                                      </>
                                    )}
                                  </SidebarMenuButton>
                                </TooltipTrigger>
                                {locked && hint && (
                                  <TooltipContent side="right">
                                    <div className="text-center">
                                      <div className="font-medium">🔒 Locked</div>
                                      <div className="text-xs text-muted-foreground">{hint}</div>
                                    </div>
                                  </TooltipContent>
                                )}
                              </Tooltip>
                            </TooltipProvider>
                          </SidebarMenuItem>
                        );
                      })}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>
          );
        })}

        <Separator className="my-3" />

        {/* External Pages */}
        <SidebarGroup>
          <SidebarGroupLabel className="px-2 py-1.5">
            <span className="text-base">📄</span>
            {!isCollapsed && <span className="ml-2 font-medium">Pages</span>}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {EXTERNAL_LINKS.map((link) => (
                <SidebarMenuItem key={link.href}>
                  <SidebarMenuButton asChild tooltip={isCollapsed ? link.label : undefined}>
                    <PrefetchLink to={link.href} className="w-full justify-start gap-2">
                      {link.icon}
                      {!isCollapsed && <span>{link.label}</span>}
                    </PrefetchLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3">
        {!isCollapsed && (
          <p className="text-xs text-muted-foreground text-center">
            Build your 100-acre cat empire! 🌾
          </p>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
