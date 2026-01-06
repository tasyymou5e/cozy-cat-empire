import { Skeleton } from '@/components/ui/skeleton';
import { AnimatedBackground } from '@/components/ui/AnimatedBackground';
import { FloatingDecorations } from '@/components/ui/FloatingDecorations';
import { StatusBarSkeleton } from './StatusBarSkeleton';
import { CatGridSkeleton } from './CatGridSkeleton';
import { PanelSkeleton } from './PanelSkeleton';

export function CatFarmSkeleton() {
  return (
    <AnimatedBackground variant="game" className="min-h-screen">
      <FloatingDecorations variant="paws" density="low" className="opacity-20" />
      <header className="game-header">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-48 hidden sm:block" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-10 rounded" />
          <Skeleton className="h-10 w-10 rounded" />
          <Skeleton className="h-10 w-20 rounded" />
        </div>
      </header>
      <StatusBarSkeleton />
      <div className="flex-1 flex flex-col">
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-2">
          <div className="flex w-full justify-center gap-1 p-1">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-10 rounded-md" />
            ))}
          </div>
        </div>
        <main className="game-main">
          <section className="cat-grid-section">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-4 w-20" />
            </div>
            <CatGridSkeleton count={6} />
          </section>
          <aside className="action-sidebar">
            <PanelSkeleton rows={4} />
          </aside>
        </main>
      </div>
    </AnimatedBackground>
  );
}
