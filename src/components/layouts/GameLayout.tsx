import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { ExternalPageSidebar } from '@/components/game/ExternalPageSidebar';
import { useIsMobile } from '@/hooks/use-mobile';

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
 * Provides consistent left sidebar navigation across all game pages
 * including external pages like Empire, Collection, Stats, etc.
 *
 * @example
 * ```tsx
 * <GameLayout currentPage="/empire" day={state.day} money={state.money}>
 *   <main>...</main>
 * </GameLayout>
 * ```
 */
export function GameLayout({ children, currentPage, day, money }: GameLayoutProps) {
  const location = useLocation();
  const isMobile = useIsMobile();
  const activePage = currentPage || location.pathname;

  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <div className="min-h-screen flex w-full">
        <ExternalPageSidebar currentPage={activePage} day={day} money={money} />
        <SidebarInset className="flex-1 flex flex-col min-w-0">{children}</SidebarInset>
      </div>
    </SidebarProvider>
  );
}
