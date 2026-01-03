import { Skeleton } from '@/components/ui/skeleton';

interface PanelSkeletonProps {
  rows?: number;
  showHeader?: boolean;
  showButtons?: boolean;
}

export function PanelSkeleton({ 
  rows = 3, 
  showHeader = true,
  showButtons = true 
}: PanelSkeletonProps) {
  return (
    <div className="action-panel space-y-4">
      {showHeader && (
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-6 w-32" />
        </div>
      )}
      
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
      
      {showButtons && (
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-10 flex-1 rounded-md" />
          <Skeleton className="h-10 w-24 rounded-md" />
        </div>
      )}
    </div>
  );
}
