import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';

const ADMIN_NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/catking/dashboard' },
  { id: 'users', label: 'Users', icon: Users, path: '/catking/users' },
  { id: 'profiles', label: 'Profile Repair', icon: Wrench, path: '/catking/profiles' },
  { id: 'statistics', label: 'Statistics', icon: BarChart3, path: '/catking/stats' },
  { id: 'ai-metrics', label: 'AI Metrics', icon: Sparkles, path: '/catking/ai-metrics' },
  { id: 'errors', label: 'Error Logs', icon: AlertTriangle, path: '/catking/errors' },
  { id: 'moderation', label: 'Moderation', icon: Shield, path: '/catking/moderation' },
  { id: 'announcements', label: 'Announcements', icon: Megaphone, path: '/catking/announcements' },
  { id: 'battle-pass', label: 'Battle Pass', icon: Star, path: '/catking/battle-pass' },
  { id: 'notifications', label: 'Notifications', icon: Bell, path: '/catking/notifications' },
  { id: 'config', label: 'Game Config', icon: Sliders, path: '/catking/config' },
  { id: 'settings', label: 'Settings', icon: Settings, path: '/catking/settings' },
];

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/catking');
  };

  const NavItems = ({ mobile = false }: { mobile?: boolean }) => (
    <>
      {ADMIN_NAV_ITEMS.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <Link
            key={item.id}
            to={item.path}
            onClick={() => mobile && setMobileMenuOpen(false)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted',
              mobile && 'w-full'
            )}
          >
            <item.icon className="h-4 w-4" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 border-b bg-card">
        <div className="flex h-14 items-center px-4 gap-4">
          {/* Mobile Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64">
              <div className="flex items-center gap-2 mb-6 mt-2">
                <Crown className="h-6 w-6 text-yellow-500" />
                <span className="font-bold text-lg">Cat King Admin</span>
              </div>
              <nav className="flex flex-col gap-1">
                <NavItems mobile />
              </nav>
            </SheetContent>
          </Sheet>

          {/* Brand */}
          <Link to="/catking/dashboard" className="flex items-center gap-2">
            <Crown className="h-6 w-6 text-yellow-500" />
            <span className="font-bold text-lg hidden sm:inline">Cat King Admin</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 ml-6">
            <NavItems />
          </nav>

          {/* Right Side */}
          <div className="ml-auto flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:inline">
              {user?.email}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 md:p-6 max-w-7xl mx-auto">
        {children}
      </main>
    </div>
  );
}
