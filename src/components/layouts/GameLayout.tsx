import { ReactNode, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { ExternalPageSidebar } from '@/components/game/ExternalPageSidebar';
import { MobileNavFAB } from '@/components/game/MobileNavFAB';
import { MobileGameDrawer } from '@/components/game/MobileGameDrawer';
import { useIsMobile, useDeviceType } from '@/hooks/use-mobile';

interface GameLayoutProps {
  children: ReactNode;
  /** Optional: Override the current page for sidebar highlighting */
  currentPage?: string;
  /** Show day/money stats in sidebar header (requires gameState) */
  day?: number;
  money?: number;
}

/**
 * GameLayout - Shared layout wrapper for all game pages
 *
 * Provides consistent navigation across all game pages:
 * - Desktop: Left sidebar navigation (collapsible)
 * - Tablet: Collapsed sidebar by default (can expand)
 * - Mobile: Floating action button + bottom drawer
 *
 * @example
 * ```tsx
 * <GameLayout currentPage="/empire" day={state.day} money={state.money}>
 *   <main>...</main>
 * </GameLayout>
 * ```
 */
export function GameLayout({ children, currentPage, day = 1, money = 0 }: GameLayoutProps) {
  const location = useLocation();
  const isMobile = useIsMobile();
  const { isTablet } = useDeviceType();
  const activePage = currentPage || location.pathname;
  
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <SidebarProvider defaultOpen={!isMobile && !isTablet}>
      <div className="min-h-screen flex w-full">
        {/* Sidebar for tablet/desktop */}
        {!isMobile && (
          <ExternalPageSidebar currentPage={activePage} day={day} money={money} />
        )}
        
        <SidebarInset className="flex-1 flex flex-col min-w-0">
          {children}
        </SidebarInset>

        {/* Mobile: FAB + Drawer */}
        {isMobile && (
          <>
            <MobileNavFAB onOpenMenu={() => setDrawerOpen(true)} />
            <MobileGameDrawer
              open={drawerOpen}
              onOpenChange={setDrawerOpen}
              activeTab=""
              onTabChange={() => {}}
              badges={{}}
              day={day}
              money={money}
            />
          </>
        )}
      </div>
    </SidebarProvider>
  );
}
