import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { PrefetchLink } from '@/components/PrefetchLink';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  Crown,
  LayoutDashboard,
  Users,
  BarChart3,
  AlertTriangle,
  Shield,
  Settings,
  LogOut,
  Menu,
  Megaphone,
  Sparkles,
  Sliders,
  Bell,
  Star,
  Wrench,
  Clock,
  GraduationCap,
  Database,
  BookOpen,
  Terminal,
  ChevronDown,
  PanelLeftClose,
  PanelLeft,
  Crosshair,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/catking/dashboard' },
    ],
  },
  {
    label: 'User Management',
    items: [
      { id: 'users', label: 'Users', icon: Users, path: '/catking/users' },
      { id: 'profiles', label: 'Profile Repair', icon: Wrench, path: '/catking/profiles' },
      { id: 'game-repair', label: 'Game Save Repair', icon: Database, path: '/catking/game-repair' },
    ],
  },
  {
    label: 'Analytics',
    items: [
      { id: 'statistics', label: 'Statistics', icon: BarChart3, path: '/catking/stats' },
      { id: 'tutorial', label: 'Tutorial Analytics', icon: GraduationCap, path: '/catking/tutorial' },
      { id: 'ai-metrics', label: 'AI Metrics', icon: Sparkles, path: '/catking/ai-metrics' },
    ],
  },
  {
    label: 'Monitoring',
    items: [
      { id: 'errors', label: 'Error Logs', icon: AlertTriangle, path: '/catking/errors' },
      { id: 'winston', label: 'Winston Logger', icon: Terminal, path: '/catking/winston' },
      { id: 'security', label: 'Security Audit', icon: Shield, path: '/catking/security' },
    ],
  },
  {
    label: 'Content',
    items: [
      { id: 'moderation', label: 'Moderation', icon: Shield, path: '/catking/moderation' },
      { id: 'announcements', label: 'Announcements', icon: Megaphone, path: '/catking/announcements' },
      { id: 'battle-pass', label: 'Battle Pass', icon: Star, path: '/catking/battle-pass' },
      { id: 'notifications', label: 'Notifications', icon: Bell, path: '/catking/notifications' },
    ],
  },
  {
    label: 'System',
    items: [
      { id: 'scheduled-jobs', label: 'Scheduled Jobs', icon: Clock, path: '/catking/scheduled-jobs' },
      { id: 'config', label: 'Game Config', icon: Sliders, path: '/catking/config' },
      { id: 'tracking', label: 'Ad Tracking', icon: Crosshair, path: '/catking/tracking' },
      { id: 'docs', label: 'Documentation', icon: BookOpen, path: '/catking/docs' },
      { id: 'settings', label: 'Settings', icon: Settings, path: '/catking/settings' },
    ],
  },
];

function groupForPath(pathname: string): string | null {
  for (const group of NAV_GROUPS) {
    if (group.items.some((i) => pathname === i.path)) return group.label;
  }
  return null;
}

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const activeGroup = groupForPath(location.pathname);

  const handleSignOut = async () => {
    await signOut();
    navigate('/catking');
  };

  const SidebarNav = ({ mobile = false }: { mobile?: boolean }) => (
    <div className="flex flex-col gap-1">
      {NAV_GROUPS.map((group) => {
        const isGroupActive = group.label === activeGroup;

        return (
          <Collapsible key={group.label} defaultOpen={isGroupActive || group.items.length === 1}>
            <CollapsibleTrigger
              className={cn(
                'flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors',
                'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                collapsed && !mobile && 'justify-center px-0'
              )}
            >
              {(!collapsed || mobile) && <span>{group.label}</span>}
              {(!collapsed || mobile) && (
                <ChevronDown className="h-3 w-3 transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
              )}
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="flex flex-col gap-0.5 py-0.5">
                {group.items.map((item) => {
                  const isActive = location.pathname === item.path;
                  const link = (
                    <PrefetchLink
                      key={item.id}
                      to={item.path}
                      onClick={() => mobile && setMobileMenuOpen(false)}
                      className={cn(
                        'flex items-center gap-2.5 rounded-md text-sm font-medium transition-colors',
                        collapsed && !mobile ? 'justify-center px-2 py-2' : 'px-3 py-1.5',
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      )}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {(!collapsed || mobile) && <span>{item.label}</span>}
                    </PrefetchLink>
                  );

                  if (collapsed && !mobile) {
                    return (
                      <Tooltip key={item.id} delayDuration={0}>
                        <TooltipTrigger asChild>{link}</TooltipTrigger>
                        <TooltipContent side="right" sideOffset={8}>
                          {item.label}
                        </TooltipContent>
                      </Tooltip>
                    );
                  }
                  return <span key={item.id}>{link}</span>;
                })}
              </div>
            </CollapsibleContent>
          </Collapsible>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen flex w-full bg-background">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden md:flex flex-col border-r bg-card transition-[width] duration-200',
          collapsed ? 'w-14' : 'w-56'
        )}
      >
        {/* Brand */}
        <div className={cn('flex items-center gap-2 border-b h-14 shrink-0', collapsed ? 'justify-center px-2' : 'px-3')}>
          <PrefetchLink to="/catking/dashboard" className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-500 shrink-0" />
            {!collapsed && <span className="font-bold text-sm">Cat King</span>}
          </PrefetchLink>
        </div>

        {/* Nav */}
        <ScrollArea className="flex-1 px-2 py-3">
          <SidebarNav />
        </ScrollArea>

        {/* Footer */}
        <div className={cn('border-t p-2 flex flex-col gap-1', collapsed && 'items-center')}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className="w-full justify-center text-muted-foreground hover:text-foreground"
          >
            {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </Button>
          {!collapsed && (
            <span className="text-[10px] text-muted-foreground truncate px-1">{user?.email}</span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className={cn('text-muted-foreground hover:text-foreground', collapsed ? 'w-8 px-0' : 'w-full justify-start')}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span className="ml-2 text-xs">Logout</span>}
          </Button>
        </div>
      </aside>

      {/* Mobile Header + Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-50 flex md:hidden h-14 items-center border-b bg-card px-4 gap-3">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-4">
              <div className="flex items-center gap-2 mb-4">
                <Crown className="h-6 w-6 text-yellow-500" />
                <span className="font-bold text-lg">Cat King</span>
              </div>
              <ScrollArea className="h-[calc(100vh-8rem)]">
                <SidebarNav mobile />
              </ScrollArea>
              <div className="border-t pt-2 mt-2">
                <span className="text-xs text-muted-foreground block mb-1 truncate">{user?.email}</span>
                <Button variant="ghost" size="sm" onClick={handleSignOut} className="w-full justify-start text-muted-foreground">
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </SheetContent>
          </Sheet>
          <PrefetchLink to="/catking/dashboard" className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-500" />
            <span className="font-bold">Cat King</span>
          </PrefetchLink>
        </header>

        <main className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full">{children}</main>
      </div>
    </div>
  );
}
