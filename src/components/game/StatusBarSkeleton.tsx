import { Skeleton } from '@/components/ui/skeleton';

export function StatusBarSkeleton() {
  return (
    <div className="status-bar">
      <div className="flex flex-wrap gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="status-item">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-4 w-12" />
          </div>
        ))}
      </div>
    </div>
  );
}
