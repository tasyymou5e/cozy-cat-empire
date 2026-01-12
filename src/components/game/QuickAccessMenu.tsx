import { PrefetchLink } from '@/components/PrefetchLink';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import {
  Gamepad2,
  BarChart3,
  LayoutGrid,
  Heart,
  Camera,
  Image,
  Globe,
  Settings,
  Clock,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface RecentTab {
  tab: string;
  label: string;
  icon: string;
  timestamp: number;
}

interface QuickAccessMenuProps {
  recentTabs?: RecentTab[];
  onNavigateTab?: (tab: string) => void;
}

const EXTERNAL_LINKS = [
  { href: '/stats', icon: <BarChart3 className="h-4 w-4" />, label: 'My Stats' },
  { href: '/collection', icon: <LayoutGrid className="h-4 w-4" />, label: 'Cat Collection' },
  { href: '/relationships', icon: <Heart className="h-4 w-4" />, label: 'Cat Relationships' },
  { href: '/photobooth', icon: <Camera className="h-4 w-4" />, label: 'Photo Booth' },
  { href: '/gallery', icon: <Image className="h-4 w-4" />, label: 'Photo Gallery' },
  { href: '/leaderboard', icon: <Globe className="h-4 w-4" />, label: 'Global Leaderboard' },
];

export function QuickAccessMenu({ recentTabs = [], onNavigateTab }: QuickAccessMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 min-h-10">
          <Gamepad2 className="h-4 w-4" />
          <span className="hidden sm:inline text-sm">Quick Access</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {/* Recent Tabs Section */}
        {recentTabs.length > 0 && (
          <>
            <DropdownMenuLabel className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-3 w-3" />
              Recent
            </DropdownMenuLabel>
            {recentTabs.slice(0, 4).map((recent) => (
              <DropdownMenuItem
                key={`${recent.tab}-${recent.timestamp}`}
                onClick={() => onNavigateTab?.(recent.tab)}
                className="cursor-pointer"
              >
                <span className="mr-2">{recent.icon}</span>
                <span className="flex-1">{recent.label}</span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(recent.timestamp, { addSuffix: false })}
                </span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
          </>
        )}

        {/* External Pages */}
        <DropdownMenuLabel>Pages</DropdownMenuLabel>
        {EXTERNAL_LINKS.map((link) => (
          <DropdownMenuItem key={link.href} asChild>
            <PrefetchLink to={link.href} className="flex items-center cursor-pointer">
              <span className="mr-2">{link.icon}</span>
              {link.label}
            </PrefetchLink>
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        {/* Settings shortcut */}
        <DropdownMenuItem onClick={() => onNavigateTab?.('more')} className="cursor-pointer">
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
