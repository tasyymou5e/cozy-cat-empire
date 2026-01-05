import { Link } from 'react-router-dom';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CATEGORIES } from './CategoryTabBar';
import { cn } from '@/lib/utils';
import { BarChart3, LayoutGrid, Heart, Camera, Image, Globe } from 'lucide-react';

interface MobileMenuSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  badges: Record<string, number>;
}

const EXTERNAL_LINKS = [
  { href: '/stats', icon: <BarChart3 className="h-5 w-5" />, label: 'My Stats' },
  { href: '/collection', icon: <LayoutGrid className="h-5 w-5" />, label: 'Cat Collection' },
  { href: '/relationships', icon: <Heart className="h-5 w-5" />, label: 'Cat Relationships' },
  { href: '/photobooth', icon: <Camera className="h-5 w-5" />, label: 'Photo Booth' },
  { href: '/gallery', icon: <Image className="h-5 w-5" />, label: 'Photo Gallery' },
  { href: '/leaderboard', icon: <Globe className="h-5 w-5" />, label: 'Global Leaderboard' },
];

export function MobileMenuSheet({ 
  open, 
  onOpenChange, 
  activeTab, 
  onTabChange,
  badges 
}: MobileMenuSheetProps) {
  const handleTabClick = (tabId: string) => {
    onTabChange(tabId);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[80vh] rounded-t-xl">
        <SheetHeader className="pb-4">
          <SheetTitle>Navigation</SheetTitle>
        </SheetHeader>
        
        <ScrollArea className="h-[calc(80vh-80px)]">
          <div className="space-y-6 pb-20">
            {/* All Tabs by Category */}
            {CATEGORIES.map((category) => (
              <div key={category.id}>
                <h3 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                  <span>{typeof category.icon === 'string' ? category.icon : category.icon}</span>
                  {category.label}
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {category.tabs.map((tab) => {
                    const isActive = tab.id === activeTab;
                    const badgeCount = badges[tab.id] || 0;

                    return (
                      <button
                        key={tab.id}
                        onClick={() => handleTabClick(tab.id)}
                        className={cn(
                          'relative flex flex-col items-center justify-center p-3 rounded-lg border transition-all',
                          isActive 
                            ? 'bg-primary text-primary-foreground border-primary' 
                            : 'bg-muted/50 border-border hover:bg-muted'
                        )}
                      >
                        <span className="text-lg mb-1">
                          {typeof tab.icon === 'string' ? tab.icon : tab.icon}
                        </span>
                        <span className="text-xs font-medium text-center leading-tight">
                          {tab.label}
                        </span>
                        {badgeCount > 0 && (
                          <Badge 
                            variant={isActive ? 'secondary' : 'destructive'}
                            className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[10px]"
                          >
                            {badgeCount > 9 ? '9+' : badgeCount}
                          </Badge>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            <Separator />

            {/* External Pages */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">Pages</h3>
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
      </SheetContent>
    </Sheet>
  );
}
