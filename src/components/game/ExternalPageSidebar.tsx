import { Link, useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
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
import { cn } from '@/lib/utils';
import {
  ChevronDown,
  BarChart3,
  LayoutGrid,
  Heart,
  Camera,
  Image,
  Globe,
  Castle,
  Home,
  Gamepad2,
} from 'lucide-react';
import { CATEGORIES } from './CategoryTabBar';

interface ExternalPageSidebarProps {
  /** Current page path for highlighting (e.g., '/empire', '/collection') */
  currentPage?: string;
  /** Game day for display in header */
  day?: number;
  /** Money for display in header */
  money?: number;
}

const EXTERNAL_LINKS = [
  { href: '/empire', icon: Castle, label: 'My Empire' },
  { href: '/stats', icon: BarChart3, label: 'My Stats' },
  { href: '/collection', icon: LayoutGrid, label: 'Collection' },
  { href: '/relationships', icon: Heart, label: 'Relationships' },
  { href: '/photobooth', icon: Camera, label: 'Photo Booth' },
  { href: '/gallery', icon: Image, label: 'Gallery' },
  { href: '/leaderboard', icon: Globe, label: 'Leaderboard' },
];

/**
 * ExternalPageSidebar - Simplified sidebar for external game pages
 *
 * Shows game categories (linking back to main game) and external page links
 * with current page highlighted.
 */
export function ExternalPageSidebar({ currentPage, day, money }: ExternalPageSidebarProps) {
  const { state } = useSidebar();
  const navigate = useNavigate();
  const isCollapsed = state === 'collapsed';

  const isExternalPage = (href: string) => currentPage === href;
  const isOnMainGame = currentPage === '/' || currentPage === '';

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarHeader className="p-3">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <span className="text-2xl">🐱</span>
            {!isCollapsed && (
              <span className="font-bold text-lg text-gradient-primary">Cat Farm</span>
            )}
          </Link>
          <SidebarTrigger className="h-8 w-8" />
        </div>

        {/* Quick Stats - visible when expanded and stats provided */}
        {!isCollapsed && (day !== undefined || money !== undefined) && (
          <div className="flex gap-3 mt-3 text-sm">
            {day !== undefined && (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/50">
                <span>📅</span>
                <span className="font-medium">Day {day}</span>
              </div>
            )}
            {money !== undefined && (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/50">
                <span>💰</span>
                <span className="font-medium text-gradient-gold">${money}</span>
              </div>
            )}
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="px-2">
        {/* Back to Game Button */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isOnMainGame}
                  tooltip={isCollapsed ? 'Back to Game' : undefined}
                  className={cn(
                    'w-full justify-start gap-2',
                    isOnMainGame && 'bg-primary text-primary-foreground hover:bg-primary/90'
                  )}
                >
                  <Link to="/">
                    <Gamepad2 className="h-4 w-4 shrink-0" />
                    {!isCollapsed && <span>Back to Game</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <Separator className="my-2" />

        {/* Game Categories - link to main game with tab selected */}
        {CATEGORIES.map((category) => (
          <Collapsible key={category.id} defaultOpen={false} className="group/collapsible">
            <SidebarGroup>
              <CollapsibleTrigger asChild>
                <SidebarGroupLabel className="flex items-center justify-between cursor-pointer hover:bg-muted/50 rounded-md px-2 py-1.5 transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="text-base">
                      {typeof category.icon === 'string' ? category.icon : category.icon}
                    </span>
                    {!isCollapsed && <span className="font-medium">{category.label}</span>}
                  </div>
                  {!isCollapsed && (
                    <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                  )}
                </SidebarGroupLabel>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {category.tabs.map((tab) => (
                      <SidebarMenuItem key={tab.id}>
                        <SidebarMenuButton
                          onClick={() => navigate(`/?tab=${tab.id}`)}
                          tooltip={isCollapsed ? tab.label : undefined}
                          className="w-full justify-start gap-2 transition-colors"
                        >
                          <span className="text-sm shrink-0">
                            {typeof tab.icon === 'string' ? tab.icon : tab.icon}
                          </span>
                          {!isCollapsed && <span className="flex-1 text-left">{tab.label}</span>}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        ))}

        <Separator className="my-3" />

        {/* External Pages */}
        <SidebarGroup>
          <SidebarGroupLabel className="px-2 py-1.5">
            <span className="text-base">📄</span>
            {!isCollapsed && <span className="ml-2 font-medium">Pages</span>}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {EXTERNAL_LINKS.map((link) => {
                const isActive = isExternalPage(link.href);
                const IconComponent = link.icon;

                return (
                  <SidebarMenuItem key={link.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={isCollapsed ? link.label : undefined}
                      className={cn(
                        'w-full justify-start gap-2',
                        isActive && 'bg-primary text-primary-foreground hover:bg-primary/90'
                      )}
                    >
                      <Link to={link.href}>
                        <IconComponent className="h-4 w-4 shrink-0" />
                        {!isCollapsed && <span>{link.label}</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
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
